import { useEffect, useState } from "react";

function useRealTimeInternetStatus(interval = 10000) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        let intervalId;

        const verifyConnection = async () => {
            if (!navigator.onLine) {
                setIsOnline(false);
                return;
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            try {
                const response = await fetch("https://httpbin.org/status/204", {
                    method: "GET",
                    cache: "no-cache",
                    signal: controller.signal,
                });
                setIsOnline(response.ok);
            } catch {
                setIsOnline(navigator.onLine);
            } finally {
                clearTimeout(timeout);
            }
        };

        window.addEventListener("online", verifyConnection);
        window.addEventListener("offline", () => setIsOnline(false));

        verifyConnection();
        intervalId = setInterval(verifyConnection, interval);

        return () => {
            window.removeEventListener("online", verifyConnection);
            window.removeEventListener("offline", () => setIsOnline(false));
            clearInterval(intervalId);
        };
    }, [interval]);

    return isOnline;
}

export default useRealTimeInternetStatus;
