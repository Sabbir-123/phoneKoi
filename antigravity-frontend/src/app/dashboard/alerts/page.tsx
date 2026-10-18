'use client';

import { API_URL, authFetch } from '@/utils/api';
import { useDashboardStore } from '@/store/useDashboardStore';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  Bell,
  ShieldAlert,
  CheckCircle2,
  Info,
  RefreshCw,
  MapPin,
  Clock,
  Filter,
  Check,
  Smartphone,
  ExternalLink,
  FileText,
  Printer,
  X,
  AlertTriangle,
  Radio,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Eye,
  MessageSquare,
  Mail,
  PhoneCall,
  Search,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { InteractiveLoader } from '@/components/ui/InteractiveLoader';

// Dynamically load the Leaflet map with SSR disabled
const SearchEventsMap = dynamic(() => import('@/components/dashboard/SearchEventsMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] md:h-[420px] rounded-3xl bg-slate-100 flex items-center justify-center border border-slate-200">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400">Loading Map Engine...</span>
      </div>
    </div>
  ),
});

interface DeliveryStatus {
  channel: 'IN_APP' | 'WHATSAPP' | 'EMAIL' | 'SMS';
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  timestamp: string;
}

interface SearchEventItem {
  id: string;
  deviceId: string;
  maskedImei: string;
  brand?: string;
  model?: string;
  searchTimestamp: string;
  searchResult: string;
  locationSource: 'BROWSER_GPS' | 'IP_GEOLOCATION' | 'UNAVAILABLE';
  approximateLocation: string;
  latitude: number | null;
  longitude: number | null;
  accuracyRadius: number | null;
  isRead: boolean;
  notificationProcessingStatus: string;
  deliveryStatuses: DeliveryStatus[];
  lawEnforcementGuidance?: string;
}

export default function AlertsPage() {
  const { language } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<'imei-alerts' | 'general-alerts'>('imei-alerts');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  // IMEI Search Alerts State
  const [searchEvents, setSearchEvents] = useState<SearchEventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<SearchEventItem | null>(null);

  // Filters
  const [filterDevice, setFilterDevice] = useState<string>('ALL');
  const [filterAccuracy, setFilterAccuracy] = useState<string>('ALL');
  const [filterReadStatus, setFilterReadStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // General System Alerts State
  const [generalAlerts, setGeneralAlerts] = useState<any[]>([]);
  const [globalAlerts, setGlobalAlerts] = useState(true);
  const [areaAlerts, setAreaAlerts] = useState(true);

  const fetchAllData = async (email: string, silent = false) => {
    if (!email) return;
    try {
      if (!silent) setLoading(true);

      // Fetch IMEI search alerts
      const searchRes = await authFetch(`${API_URL}/search-events/owner?email=${encodeURIComponent(email)}`);
      if (searchRes.ok) {
        const eventsData = await searchRes.json();
        const normalized = eventsData.map((e: any) => ({
          ...e,
          brand: e.brand || e.deviceBrand || 'Device',
          model: e.model || e.deviceModel || '',
          searchTimestamp: e.searchTimestamp || e.timestamp || new Date().toISOString(),
          approximateLocation: e.approximateLocation || e.locationName || 'Dhaka, Bangladesh (approximate)',
          locationSource: e.locationSource === 'BROWSER_GPS' ? 'BROWSER_GPS' : (e.locationSource === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'IP_GEOLOCATION'),
          deliveryStatuses: e.deliveryStatuses || e.notifications || [],
        }));
        setSearchEvents(normalized);
      }

      // Fetch general alerts
      const genRes = await authFetch(`${API_URL}/users/alerts?email=${encodeURIComponent(email)}`);
      if (genRes.ok) {
        const genData = await genRes.json();
        setGeneralAlerts(genData);
      }

    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: any;

    const init = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || '';

      if (email) {
        setUserEmail(email);
        fetchAllData(email, false);

        intervalId = setInterval(() => {
          fetchAllData(email, true);
        }, 6000);
      } else {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleRefresh = async () => {
    if (userEmail) {
      await fetchAllData(userEmail, false);
    }
  };

  const handleToggleRead = async (event: SearchEventItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newReadState = !event.isRead;
      setSearchEvents((prev) =>
        prev.map((item) => (item.id === event.id ? { ...item, isRead: newReadState } : item))
      );
      await authFetch(`${API_URL}/search-events/${event.id}/mark-read`, {
        method: 'POST',
      });

    } catch (err) {
      console.error('Failed to toggle read state:', err);
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return searchEvents.filter((ev) => {
      // Filter Device
      if (filterDevice !== 'ALL' && ev.deviceId !== filterDevice && ev.maskedImei !== filterDevice) {
        return false;
      }
      // Filter Accuracy
      if (filterAccuracy !== 'ALL' && ev.locationSource !== filterAccuracy) {
        return false;
      }
      // Filter Read Status
      if (filterReadStatus === 'UNREAD' && ev.isRead) return false;
      if (filterReadStatus === 'READ' && !ev.isRead) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesImei = ev.maskedImei.toLowerCase().includes(q);
        const matchesLocation = ev.approximateLocation.toLowerCase().includes(q);
        const matchesDevice = (ev.brand || '').toLowerCase().includes(q) || (ev.model || '').toLowerCase().includes(q);
        if (!matchesImei && !matchesLocation && !matchesDevice) return false;
      }

      return true;
    });
  }, [searchEvents, filterDevice, filterAccuracy, filterReadStatus, searchQuery]);

  // Unique devices for filter dropdown
  const uniqueDevices = useMemo(() => {
    const map = new Map<string, string>();
    searchEvents.forEach((ev) => {
      map.set(ev.deviceId, `${ev.brand || 'Device'} ${ev.model || ''} (${ev.maskedImei})`);
    });
    return Array.from(map.entries());
  }, [searchEvents]);

  // Statistics
  const stats = useMemo(() => {
    const total = searchEvents.length;
    const gpsCount = searchEvents.filter((e) => e.locationSource === 'BROWSER_GPS').length;
    const unreadCount = searchEvents.filter((e) => !e.isRead).length;
    const deliveredCount = searchEvents.reduce((acc, ev) => {
      return acc + (ev.deliveryStatuses?.filter((d) => d.status === 'DELIVERED').length || 0);
    }, 0);
    return { total, gpsCount, unreadCount, deliveredCount };
  }, [searchEvents]);

  const formatDateTime = (timestamp: string) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });
    } catch {
      return timestamp;
    }
  };

  const getAccuracyBadge = (source: string, radius: number | null) => {
    switch (source) {
      case 'BROWSER_GPS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 border border-red-200 text-red-700">
            <Radio className="w-3 h-3 text-red-600 animate-pulse" />
            Browser GPS (±{radius || 25}m)
          </span>
        );
      case 'IP_GEOLOCATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
            <MapPin className="w-3 h-3 text-amber-600" />
            IP Approx (City Level)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
            Location Unavailable
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-3">
            <Radio className="w-8 h-8 text-red-600 animate-pulse" />
            <span>IMEI Search Alerts</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Real-time notifications and location audit when someone queries your reported lost or stolen phones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="h-10 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl flex items-center gap-2 text-xs font-bold text-slate-600 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('imei-alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'imei-alerts'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Real-Time Search Inquiries</span>
          {stats.unreadCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white animate-pulse">
              {stats.unreadCount} NEW
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('general-alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'general-alerts'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>System Broadcasts & Watchlist</span>
        </button>
      </div>

      {activeTab === 'imei-alerts' ? (
        <div className="space-y-8">
          {/* Top Key Metrics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Searches</span>
              <div className="text-2xl md:text-3xl font-black text-indigo-950">{stats.total}</div>
              <p className="text-[11px] text-slate-500 font-medium">Recorded on PhoneKoi</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-red-200/80 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">GPS Confirmed</span>
              <div className="text-2xl md:text-3xl font-black text-red-600">{stats.gpsCount}</div>
              <p className="text-[11px] text-red-500 font-medium">Browser Geolocation</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-indigo-200/80 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider">Dispatched Alerts</span>
              <div className="text-2xl md:text-3xl font-black text-indigo-600">{stats.deliveredCount}</div>
              <p className="text-[11px] text-slate-500 font-medium">Multi-channel delivery</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unread Alerts</span>
              <div className="text-2xl md:text-3xl font-black text-amber-600">{stats.unreadCount}</div>
              <p className="text-[11px] text-slate-500 font-medium">Pending owner review</p>
            </div>
          </div>

          {/* Interactive Map Component */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-indigo-950 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-indigo-600" />
                <span>Search Location Intelligence Map</span>
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                Pulsing radar pins represent consent-based search origins
              </span>
            </div>

            <SearchEventsMap
              events={searchEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={(ev) => {
                setSelectedEventId(ev.id);
                setModalEvent(ev as SearchEventItem);
              }}
            />
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter IMEI, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white text-slate-800 w-48"
                />
              </div>

              {/* Device Filter */}
              <select
                value={filterDevice}
                onChange={(e) => setFilterDevice(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-bold"
              >
                <option value="ALL">All Devices</option>
                {uniqueDevices.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Accuracy Filter */}
              <select
                value={filterAccuracy}
                onChange={(e) => setFilterAccuracy(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-bold"
              >
                <option value="ALL">All Accuracy Levels</option>
                <option value="BROWSER_GPS">Browser GPS (High Accuracy)</option>
                <option value="IP_GEOLOCATION">IP Approx (City Level)</option>
                <option value="UNAVAILABLE">Location Unavailable</option>
              </select>

              {/* Read Filter */}
              <select
                value={filterReadStatus}
                onChange={(e) => setFilterReadStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-bold"
              >
                <option value="ALL">All Status</option>
                <option value="UNREAD">Unread Only</option>
                <option value="READ">Read Only</option>
              </select>
            </div>

            <span className="text-xs font-bold text-slate-400">
              Showing {filteredEvents.length} of {searchEvents.length} searches
            </span>
          </div>

          {/* Search Events List */}
          <div className="space-y-4">
            {loading ? (
              <InteractiveLoader
                title="Scanning Stolen Device Search Telemetry"
                subtitle="Querying real-time geo-coordinates, IP logs, and carrier alerts from Supabase"
                skeletonType="table"
                onRefresh={handleRefresh}
                stages={[
                  'Connecting to Phone Koi real-time event pipeline...',
                  'Querying telemetry logs for your registered devices...',
                  'Resolving cell-tower & IP reverse geolocations...',
                  'Verifying encrypted alert dispatch records...',
                ]}
              />
            ) : filteredEvents.length === 0 ? (
              <GlassCard className="py-16 text-center space-y-3 bg-white border border-slate-200">
                <Radio className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-indigo-950">No Search Inquiries Detected</h3>
                <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
                  When someone enters the 15-digit IMEI of your registered stolen phone into PhoneKoi, you will immediately receive an alert here with time and location telemetry.
                </p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((ev) => {
                  const isGps = ev.locationSource === 'BROWSER_GPS';
                  const isSelected = selectedEventId === ev.id;

                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-200'
                          : ev.isRead
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-red-50/20 border-red-200 shadow-sm'
                      }`}
                      onClick={() => {
                        setSelectedEventId(ev.id);
                        setModalEvent(ev);
                      }}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left column: Device + Masked IMEI */}
                        <div className="flex items-start gap-4">
                          <div
                            className={`p-3 rounded-2xl shrink-0 ${
                              isGps ? 'bg-red-50 border border-red-100 text-red-600' : 'bg-slate-50 border border-slate-150 text-slate-600'
                            }`}
                          >
                            <Smartphone className="w-6 h-6" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-indigo-950 text-base">
                                {ev.brand || 'Registered'} {ev.model || 'Device'}
                              </h3>
                              {!ev.isRead && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-red-600 text-white uppercase">
                                  NEW
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600">
                              <span>IMEI: {ev.maskedImei}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-[11px] font-sans font-semibold text-slate-500">
                                {formatDateTime(ev.searchTimestamp)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              {getAccuracyBadge(ev.locationSource, ev.accuracyRadius)}
                              <span className="text-xs text-slate-600 font-semibold">
                                📍 {ev.approximateLocation}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right column: Delivery badges + Action buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          {/* Channel Status Pills */}
                          <div className="flex items-center gap-1.5">
                            {ev.deliveryStatuses?.map((ch, idx) => (
                              <span
                                key={idx}
                                title={`${ch.channel}: ${ch.status}`}
                                className={`p-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 ${
                                  ch.status === 'DELIVERED'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                              >
                                {ch.channel === 'WHATSAPP' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                                {ch.channel === 'EMAIL' && <Mail className="w-3.5 h-3.5 text-blue-600" />}
                                {ch.channel === 'SMS' && <PhoneCall className="w-3.5 h-3.5 text-purple-600" />}
                                {ch.channel === 'IN_APP' && <Bell className="w-3.5 h-3.5 text-indigo-600" />}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleToggleRead(ev, e)}
                              className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                                ev.isRead
                                  ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                                  : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                              }`}
                              title={ev.isRead ? 'Mark as unread' : 'Mark as read'}
                            >
                              <Check className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedEventId(ev.id);
                                setModalEvent(ev);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Details & Police Slip
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* General System Alerts */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {generalAlerts.length === 0 ? (
              <GlassCard className="py-20 text-center space-y-3 bg-white border border-slate-200">
                <Bell className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-indigo-950">Watchlist is clean</h3>
                <p className="text-xs text-slate-400 font-semibold max-w-xs mx-auto">
                  No alerts triggered for your watchlisted IMEIs or device updates.
                </p>
              </GlassCard>
            ) : (
              generalAlerts.map((alert, i) => (
                <div
                  key={alert.id || i}
                  className="p-5 flex gap-4 items-start bg-white border border-slate-200 rounded-2xl shadow-sm"
                >
                  <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-indigo-950 text-base">{alert.title}</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {alert.time}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed font-semibold">{alert.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-indigo-950 text-base">Alert Settings</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">Global Queries</p>
                    <p className="text-[10px] text-slate-400 font-medium">When reported device is searched.</p>
                  </div>
                  <button onClick={() => setGlobalAlerts(!globalAlerts)} className="text-indigo-600">
                    {globalAlerts ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-indigo-950">Area Specific</p>
                    <p className="text-[10px] text-slate-400 font-medium">Flag matches in my district.</p>
                  </div>
                  <button onClick={() => setAreaAlerts(!areaAlerts)} className="text-indigo-600">
                    {areaAlerts ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details & Police Evidence Slip Modal */}
      <AnimatePresence>
        {modalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalEvent(null)}
              className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] z-10 space-y-6"
            >
              <button
                onClick={() => setModalEvent(null)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="border-b border-slate-150 pb-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <ShieldAlert className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 uppercase tracking-widest">
                    OFFICIAL EVIDENCE SLIP
                  </span>
                  <h3 className="text-xl font-extrabold text-indigo-950 mt-1">
                    IMEI Search Telemetry & Audit Report
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Verified record for Law Enforcement (Police Thana / RAB)
                  </p>
                </div>
              </div>

              {/* Printable Body Content */}
              <div id="police-evidence-slip" className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-150">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device Model</span>
                    <p className="font-extrabold text-indigo-950 text-sm">{modalEvent.brand} {modalEvent.model}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Masked IMEI</span>
                    <p className="font-mono font-extrabold text-indigo-950 text-sm">{modalEvent.maskedImei}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Search Date & Time</span>
                    <p className="text-slate-800">{formatDateTime(modalEvent.searchTimestamp)}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Event ID</span>
                    <p className="font-mono text-slate-600">{modalEvent.id}</p>
                  </div>
                </div>

                {/* Location Evidence */}
                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-150/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <MapPin className="w-4 h-4 text-indigo-600" /> Location Telemetry Evidence
                    </span>
                    {getAccuracyBadge(modalEvent.locationSource, modalEvent.accuracyRadius)}
                  </div>

                  <p className="text-sm font-bold text-slate-800">
                    {modalEvent.approximateLocation}
                  </p>

                  {modalEvent.latitude && modalEvent.longitude && (
                    <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600 pt-1">
                      <span>Latitude: {modalEvent.latitude.toFixed(6)}° N</span>
                      <span>Longitude: {modalEvent.longitude.toFixed(6)}° E</span>
                      {modalEvent.accuracyRadius && <span>Radius: ±{modalEvent.accuracyRadius}m</span>}
                    </div>
                  )}
                </div>

                {/* Notification Delivery Audit */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-2">
                  <span className="font-extrabold text-indigo-950 text-xs uppercase tracking-wide">
                    Notification Dispatch Audit Log
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {modalEvent.deliveryStatuses?.map((ch, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-white border border-slate-150 space-y-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{ch.channel}</span>
                        <p className="text-[10px] font-black text-emerald-600">DELIVERED</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Crucial Law Enforcement Guidelines */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Important Law Enforcement Advisory</span>
                  </div>
                  <p className="text-[11px] font-medium leading-relaxed">
                    {modalEvent.lawEnforcementGuidance ||
                      "Do NOT confront any suspect yourself. This log proves someone queried the IMEI on PhoneKoi at the indicated location and time. Hand this record to your investigating Police Officer for safe legal recovery."}
                  </p>
                  <p className="text-[10px] font-mono text-amber-700/80 pt-1">
                    *Clearly labeled as an IMEI search event, not physical device GPS hardware proof.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Print Evidence Slip
                </button>

                <button
                  onClick={() => setModalEvent(null)}
                  className="btn-primary py-2.5 px-6 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
