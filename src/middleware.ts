import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => request.cookies.getAll(), setAll: values => values.forEach(({ name, value, options }) => { request.cookies.set(name, value); response = NextResponse.next({ request }); response.cookies.set(name, value, options); }) } });
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login');
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/transactions') || request.nextUrl.pathname.startsWith('/accounts') || request.nextUrl.pathname.startsWith('/categories') || request.nextUrl.pathname.startsWith('/cards') || request.nextUrl.pathname.startsWith('/recurrences') || request.nextUrl.pathname.startsWith('/vehicles') || request.nextUrl.pathname.startsWith('/fuel') || request.nextUrl.pathname.startsWith('/settings');
  if (!user && isProtectedRoute) return NextResponse.redirect(new URL('/login', request.url));
  if (user && isAuthRoute) return NextResponse.redirect(new URL('/dashboard', request.url));
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
