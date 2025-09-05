import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are not set");
    throw new Error("Supabase configuration is missing");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

const supabase = createClient();

// 인증 관련 함수들
export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (error) {
    console.error("signIn error:", error);
    return { data: null, error };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return { user: null, error };
  }
};

export const getSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error("getSession error:", error);
    return { session: null, error };
  }
};
