import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ROLES = new Set(['owner', 'admin', 'accountant', 'hr', 'employee']);

interface CreateUserPayload {
  email: string;
  password: string;
  name: string;
  role?: string;
  employeeId?: string;
  avatar?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Server environment is missing Supabase configuration.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify caller identity from JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: callerAuth },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !callerAuth?.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired authentication token.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify caller authorization in public.users via service_role client
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: callerProfile, error: profileError } = await adminClient
      .from('users')
      .select('id, role, is_active')
      .ilike('email', callerAuth.email)
      .maybeSingle();

    if (profileError || !callerProfile || !callerProfile.is_active) {
      return new Response(
        JSON.stringify({ error: 'Caller profile not found or inactive.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callerRole = String(callerProfile.role || '').toLowerCase();
    if (callerRole !== 'owner' && callerRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only Owner or Admin can provision users.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse and validate request payload
    const body = (await req.json()) as CreateUserPayload;
    const cleanEmail = body.email?.trim().toLowerCase();
    const cleanName = body.name?.trim();
    const password = body.password;
    const requestedRole = (body.role || 'employee').toLowerCase();

    if (!cleanEmail || !cleanName || !password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Valid name, email, and password (min 6 characters) are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!VALID_ROLES.has(requestedRole)) {
      return new Response(
        JSON.stringify({ error: 'Invalid user role specified.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Only an Owner can create another Owner
    if (requestedRole === 'owner' && callerRole !== 'owner') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only an Owner can create another Owner account.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create Auth user via Admin API (does not affect caller session)
    const { data: createdAuth, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name: cleanName, role: requestedRole },
    });

    if (createAuthError || !createdAuth.user) {
      return new Response(
        JSON.stringify({ error: createAuthError?.message || 'Failed to create auth user.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Insert profile into public.users using the Auth UUID
    const avatarUrl =
      body.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`;

    const { data: insertedUser, error: insertError } = await adminClient
      .from('users')
      .upsert({
        id: createdAuth.user.id,
        name: cleanName,
        email: cleanEmail,
        role: requestedRole,
        avatar: avatarUrl,
        is_active: true,
        employee_id: body.employeeId || null,
      })
      .select('*')
      .single();

    if (insertError) {
      // Roll back Auth user if public.users insert failed
      await adminClient.auth.admin.deleteUser(createdAuth.user.id);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ user: insertedUser }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected server error.';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
