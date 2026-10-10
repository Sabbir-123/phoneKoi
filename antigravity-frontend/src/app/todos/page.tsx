import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Supabase Todos Example</h1>
      <ul className="space-y-2 w-full max-w-md">
        {todos && todos.length > 0 ? (
          todos.map((todo: any) => (
            <li
              key={todo.id}
              className="p-3 rounded-lg bg-slate-900 border border-slate-800"
            >
              {todo.name}
            </li>
          ))
        ) : (
          <p className="text-slate-400 text-sm">
            No todos found or &apos;todos&apos; table not yet populated in Supabase.
          </p>
        )}
      </ul>
    </div>
  );
}
