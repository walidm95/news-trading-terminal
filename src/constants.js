export const ExecutionMode = Object.freeze({
  entry: {
    MARKET: "Market",
    MKT_SCALE: "Mkt + Scale",
  },
  exit: {
    NONE: "None",
    SPLIT_TP_STOP: "Split TP stops",
    SPLIT_TP_LIMIT: "Split limits",
  },
});

export const ApiRoutes = Object.freeze({
  GET_WS_API_KEY: "https://s19fwd8bkg.execute-api.us-east-1.amazonaws.com/dev/wsapi",
  GET_TREE_API_KEY: "https://s19fwd8bkg.execute-api.us-east-1.amazonaws.com/dev/treeapikey",
  CONNECT_WS: "wss://blv86lub8a.execute-api.us-east-1.amazonaws.com/dev",
});
