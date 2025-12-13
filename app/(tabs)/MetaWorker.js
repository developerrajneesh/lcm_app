import { useState } from "react";
import MetaConnectScreen from "../../Components/meta/ConnectMetaAccount";
import MetaCompaigns from "../../Components/meta/MetaCompaigns";

const MetaWorker = () => {
  const [isConnected, setIsConnected] = useState(false);
  if (!isConnected) {
    return <MetaConnectScreen onSuccess={() => setIsConnected(true)} />;
  }
  return <MetaCompaigns />;
};

export default MetaWorker;
