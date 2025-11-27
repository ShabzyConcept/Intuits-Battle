import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Check if a wallet address is an admin
 */
export async function isAdminWallet(walletAddress: string): Promise<boolean> {
  if (!walletAddress) return false;

  try {
    const { data, error } = await supabaseBrowser.rpc("is_admin_wallet", { wallet_addr: walletAddress.toLowerCase() });

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Error in isAdminWallet:", error);
    return false;
  }
}

/**
 * Get the count of members created by a wallet
 */
export async function getMemberCountByWallet(walletAddress: string): Promise<number> {
  if (!walletAddress) return 0;

  try {
    const { data, error } = await supabaseBrowser.rpc("get_member_count_by_wallet", { wallet_addr: walletAddress.toLowerCase() });

    if (error) {
      console.error("Error getting member count:", error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error("Error in getMemberCountByWallet:", error);
    return 0;
  }
}

/**
 * Check if a wallet can create a new member
 * Admins: unlimited, Regular users: 1 member max
 */
export async function canCreateMember(walletAddress: string): Promise<boolean> {
  if (!walletAddress) return false;

  try {
    const { data, error } = await supabaseBrowser.rpc("can_create_member", { wallet_addr: walletAddress.toLowerCase() });

    if (error) {
      console.error("Error checking create permission:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Error in canCreateMember:", error);
    return false;
  }
}

/**
 * Get all admin wallets
 */
export async function getAdminWallets(): Promise<string[]> {
  try {
    const { data, error } = await supabaseBrowser.from("admin_wallets").select("wallet_address").eq("is_active", true);

    if (error) {
      console.error("Error fetching admin wallets:", error);
      return [];
    }

    return data?.map((row) => row.wallet_address) || [];
  } catch (error) {
    console.error("Error in getAdminWallets:", error);
    return [];
  }
}
