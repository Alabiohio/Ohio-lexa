import { supabase } from "../../supabaseClient";
import defaultAvatar from '../../assets/images/default-avatar.png'

export async function fetchSession() {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user || null;
}

export async function fetchUserProfile() {
    const user = await fetchSession();

    if (!user) return null;



    const metadata = user.user_metadata || {};

    const gAvartar = metadata.picture;
    const uAvartar = metadata.avatar_url;
    let fAvartar;

    if (uAvartar) {
        fAvartar = uAvartar;
    } else {
        fAvartar = gAvartar;
    }

    const displayName =
        metadata.display_name ||   // your manual signup name
        metadata.full_name ||           // Google name
        "User";

    const avatar = fAvartar || defaultAvatar

    return {
        username: displayName,
        avatar,
        email: user.email,
    };
}
