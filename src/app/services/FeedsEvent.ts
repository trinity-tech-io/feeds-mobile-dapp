declare namespace FeedsEvent {
  const enum PublishType {
    ////////
    carrierReady = 'carrier:ready',
    carrierConnectionChanged = 'carrier:connectionChanged',
    carrierFriendConnection = 'carrier:friendConnection',
    carrierFriendInfo = 'carrier:friendInfo',
    carrierFriendList = 'carrier:friendList',
    carrierFriendAdded = 'carrier:friendAdded',
    carrierFriendRemoved = 'carrier:friendRemoved',
    carrierFriendMessage = 'carrier:friendMessage',
    carrierFriendBinaryMessage = 'carrier:friendBinaryMessage',
    carrierSessionRequest = 'carrier:sessionRequest',

    ////////
    twitterLoginSuccess = 'twitter:loginSuccess',
    twitterLoginFailed = 'twitter:loginFailed',

    ////////
    networkStatusChanged = 'feeds:networkStatusChanged',

    ////////
    //rpcRequestError = 'rpcRequest:error',
    //rpcResponseError = 'rpcResponse:error',
    //rpcRequestSuccess = 'rpcRequest:success',

    jrpcReceiveMessage = 'jrpc:receiveMessage',
    jwtReceiveJWTMessage = 'jwt:receiveJWTMessage',

    transportReceiveMessage = 'transport:receiveMessage',
    transportReceiveJWTMessage = 'transport:receiveJWTMessage',

    ////////
    clearHomeEvent = 'feeds:clearHomeEvent',
    hideDeletedPosts = 'feeds:hideDeletedPosts',
    createpost = 'feeds:createpost',
    insertError = 'feeds:insertError',

    tipdialogCancel = 'tipdialog-cancel',
    tipdialogConfirm = 'tipdialog-confirm',

    search = 'feeds:search',
    notification = 'feeds:notification',

    updateTab = 'update:tab',
    tabSendPost = 'feeds:tabsendpost',
    hideOfflineFeeds = 'feeds:hideOfflineFeeds',
    hideUnFollowFeeds = 'feeds:hideUnFollowFeeds',

    addFeedStatusChanged = 'addFeed:statusChanged',
    openRightMenu = 'feeds:openRightMenu',
    openRightMenuForSWM = 'feeds:openRightMenuForSWM',
    editChannel = 'feeds:editChannel',
    editServer = 'feeds:editServer',
    editImages = 'feeds:editImages',
    updateTitle = 'feeds:updateTitle',
    unfollowFeedsFinish = 'feeds:unfollowFeedsFinish',
    login_finish = 'feeds:login_finish',
    owner_declared = 'feeds:owner_declared',
    updateCredentialFinish = 'feeds:updateCredentialFinish',

    //setBinaryFinish = 'feeds:setBinaryFinish',
    //getBinaryFinish = 'feeds:getBinaryFinish',
    resolveDidSucess = 'feeds:resolveDidSucess',
    resolveDidError = 'feeds:resolveDidError',
    issue_credential = 'feeds:issue_credential',
    signinSuccess = 'feeds:signinSuccess',

    ////////
    //streamOnStateChangedCallback = 'stream:onStateChangedCallback',
    //streamError = 'stream:error',
    //streamProgress = 'stream:progress',
    //streamClosed = 'stream:closed',
    // streamSetBinaryError = 'stream:setBinaryError',
    //streamGetBinaryError = 'stream:getBinaryError',

    ////////
    ownFeedListChanged = 'feeds:ownFeedListChanged  ',
    createTopicSuccess = 'feeds:createTopicSuccess',
    postEventSuccess = 'feeds:postEventSuccess',
    allFeedsListChanged = 'feeds:allFeedsListChanged',
    subscribeFinish = 'feeds:subscribeFinish',
    unsubscribeFinish = 'feeds:unsubscribeFinish',
    updateServerList = 'feeds:updateServerList',
    connectionChanged = 'feeds:connectionChanged',

    commentDataUpdate = 'feeds:commentDataUpdate',
    getCommentFinish = 'feeds:getCommentFinish',

    myChannelsDataUpdate = 'feeds:myChannelsDataUpdate',
    subscribedDataUpdate = 'feeds:subscribedChannelsDataUpdate',
    channelsDataUpdate = 'feeds:channelsDataUpdate',

    refreshMyChannel = 'feeds:refreshMyChannel',
    loadMoreMyChannel = 'feeds:loadMoreMyChannel',
    serverConnectionChanged = 'feeds:serverConnectionChanged',

    serverStatisticsChanged = 'feeds:serverStatisticsChanged',

    refreshPost = 'feeds:refreshPost',
    loadMorePost = 'feeds:loadMorePost',

    refreshChannels = 'feeds:refreshChannels',
    loadMoreChannels = 'feeds:loadMoreChannels',

    refreshSubscribedChannels = 'feeds:refreshSubscribedChannels',
    loadMoreSubscribedChannels = 'feeds:loadMoreSubscribedChannels',

    updataCommentLike = 'feeds:updataCommentLike',

    updateLikeList = 'feeds:updateLikeList',

    signInServerListChanged = 'feeds:signInServerListChanged',

    friendConnectionChanged = 'feeds:friendConnectionChanged',
    publishPostSuccess = 'feeds:publishPostSuccess',

    bindServerFinish = 'feeds:bindServerFinish',
    removeFeedSourceFinish = 'feeds:removeFeedSourceFinish',

    refreshPage = 'feeds:refreshPage',
    UpdateNotification = 'feeds:UpdateNotification',
    refreshPostDetail = 'feeds:refreshPostDetail',

    editFeedInfoFinish = 'feeds:editFeedInfoFinish',

    editPostFinish = 'feeds:editPostFinish',
    editPostSuccess = 'feeds:editPostSuccess',
    editCommentFinish = 'feeds:editCommentFinish',
    deletePostFinish = 'feeds:deletePostFinish',
    deleteCommentFinish = 'feeds:deleteCommentFinish',

    declarePostSuccess = 'feeds:declarePostSuccess',
    notifyPostSuccess = 'feeds:notifyPostSuccess',

    // addFeedFinish = "feeds:addFeedFinish",

    publishPostFinish = 'feeds:publishPostFinish',
    postDataUpdate = 'feeds:postDataUpdate',

    addProflieEvent = 'feeds:addProflieEvent',

    innerStreamSetBinaryFinish = 'feeds:innerStreamSetBinaryFinish',
    innerStreamStateChanged = 'feeds:innerStreamStateChanged',
    innerStreamError = 'stream:innerError',

    addConnectionChanged = 'feeds:addConnectionChanged',
    addRpcRequestError = 'feeds:addRpcRequestError',
    addRpcResponseError = 'feeds:addRpcResponseError',
    nftCancelOrder = 'feeds:nftCancelOrder',
    nftUpdateList = 'feeds:nftUpdateList',
    nftUpdatePrice = 'feeds:nftUpdatePrice',

    walletConnected = 'feeds:walletConnected',
    walletConnectedRefreshSM = 'feeds:walletConnectedRefreshSandwichMenu',
    walletConnectedRefreshPage = 'feeds:walletConnectedRefreshPage',
    walletDisconnected = 'feeds:walletDisconnected',
    walletDisconnectedRefreshSM = 'feeds:walletConnectedRefreshSandwichMenu',
    walletDisconnectedRefreshPage = 'feeds:walletConnectedRefreshPage',
    walletAccountChanged = 'feeds:walletConnectAccountChanged',

    startLoading = "feeds:startLoading",
    endLoading = "feeds:endLoading",
    pasarListGrid = "feeds:pasarListGrid",

    channelRightMenu = "feeds:channelRightMenu",
    channelInfoRightMenu = "feeds:channelInfoRightMenu",

    savePicture = "feeds:savePicture",
    clickDialog = "feeds:clickDialog",
    updateElaPrice = "feeds:updateElaPrice",
    clickHome = "feeds:clickHome",
    receiveNewPost = 'feeds:receiveNewPost',
    nftdisclaimer = "feeds:nftdisclaimer",
    nftBuyOrder = "feeds:nftBuyOrder",
    mintNft = "feeds:mintNft",
    clickDisconnectWallet = "feeds:clickDisconnectWallet",
    hideAdult = "feeds:hideAdult",
    nftCancelChannelOrder = "feeds:nftCancelChannelOrder",
    nftLoadingUpdateText = "feeds:nftLoadingUpdateText",
    openPayPrompt = "feeds:openPayPrompt",
    migrateDataToHive = 'feeds:migrateDataToHive',
    homeCommonEvents = 'feeds:homeCommonEvents',

    // hive
    authEssentialSuccess = 'feeds:authEssentialSuccess',
    initHiveData = 'feeds:initHiveData',
    // updateSyncHiveData = 'feeds:updateSyncHiveData',
    authEssentialFail = 'feeds:authEssentialFail',

    pinPostFinish = 'feeds:pinPostFinish',
    unpinPostFinish = 'feeds:unpinPostFinish'
  }

  type TipDialogData = {
    name: string;
    desc: string;
  };

  type getCommentData = {
    nodeId: string;
    channelId: string;
    postId: string;
  };

  type unsubscribeData = {
    nodeId: string;
    channelId: string;
    channelName: string;
  };

  type SubscribeFinishData = {
    nodeId: string;
    channelId: string;
  };

  type FriendConnectionChangedData = {
    nodeId: string;
    connectionStatus: FeedsData.ConnState;
  };

  type StreamErrorData = {
    nodeId: string;
    error: any;
  };

  type StreamStateChangedData = {
    nodeId: string;
    streamState: FeedsData.StreamState;
  };
  type setBinaryFinishData = {
    nodeId: string;
    feedId: string;
    postId: string;
    commentId: number;
    tempId: string;
  };

  type InnerStreamErrorData = {
    nodeId: string;
    error: any;
    memo: FeedsData.SessionMemoData;
  };

  type ResolveDidErrorData = {
    nodeId: string;
    did: string;
    payload: string;
  };

  type ResolveDidSucessData = {
    nodeId: string;
    did: string;
  };

  type OwnerDeclareData = {
    nodeId: string;
    phase: string;
    did: string;
    payload: string;
  };

  type CreateTopicSuccessData = {
    nodeId: string;
    channelId: number;
  };

  type StreamProgressData = {
    nodeId: string;
    progress: number;
    method: string;
    key: string;
  };

  type UnFollowFinishData = {
    nodeId: string;
    channelId: number;
    channelName: string;
  };

  type GetBinaryData = {
    nodeId: string;
    key: string;
    value: string;
  };

  type AddFeedStatusChangedData = {
    nodeId: string;
    feedId: string;
    status: FeedsData.FollowFeedStatus;
  };

  type DeclarePostData = {
    nodeId: string;
    channelId: string;
    postId: string;
    tempId: number;
  };
}
