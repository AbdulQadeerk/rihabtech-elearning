import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"; // already in your code
import { getUserActiveSubscription } from "../utils/subscriptionService";

type SubscriptionContextType = {
  activePlan: any | null;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  activePlan: null,
  loading: true,
  refreshSubscription: async () => {}
});

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setActivePlan(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getUserActiveSubscription(user.email || user.uid);
      setActivePlan(data);
    } catch (err) {
      console.error("Error fetching subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        activePlan,
        loading,
        refreshSubscription: fetchSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
