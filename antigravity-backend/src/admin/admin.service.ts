import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAllSubscriptionRequests() {
    return this.prisma.subscriptionRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async approveSubscriptionRequest(id: string) {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id }
    });

    if (!request) {
      throw new NotFoundException(`Subscription request with ID ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Subscription request is already ${request.status}`);
    }

    // Determine plan quotas
    let months = 1;
    let searches = 3;

    if (request.planName.toLowerCase().includes('3 month')) {
      months = 3;
      searches = 15;
    } else if (request.planName.toLowerCase().includes('6 month')) {
      months = 6;
      searches = 30;
    } else if (request.planName.toLowerCase().includes('12 month') || request.planName.toLowerCase().includes('1 year')) {
      months = 12;
      searches = 99;
    }

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    // Update inside a Prisma transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Update request status to APPROVED
      const approvedRequest = await tx.subscriptionRequest.update({
        where: { id },
        data: { status: 'APPROVED' }
      });

      // 2. Update user subscription status and search quota
      await tx.user.update({
        where: { id: request.userId },
        data: {
          plan: 'PRO',
          isPro: true,
          searchLimit: searches,
          searchesLeft: searches,
          subscriptionExpiresAt: expiresAt
        }
      });

      return approvedRequest;
    });
  }

  async rejectSubscriptionRequest(id: string) {
    const request = await this.prisma.subscriptionRequest.findUnique({
      where: { id }
    });

    if (!request) {
      throw new NotFoundException(`Subscription request with ID ${id} not found`);
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Subscription request is already ${request.status}`);
    }

    return this.prisma.subscriptionRequest.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
  }
}
