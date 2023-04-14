export class RedditApi {
  public static GRANT_TYPE: string = "authorization_code"
  public static GRANT_TYPE_REFRESH: string = "refresh_token"
  public static CLIENT_ID: string = "oqqIgL5Shp0DSSfYWDtK2w" //oqqIgL5Shp0DSSfYWDtK2w  HeRDPm57bP09VIhD-FbfMA
  public static REDIRECT_URI: string = "https://feeds.feedsnetwork.io/reddit"
  public static CODE_VERIFIER: string = "challenge"
  public static AUTH: string = "https://www.reddit.com/api/v1/authorize?response_type=code&client_id=HeRDPm57bP09VIhD-FbfMA&redirect_uri=https://feeds.feedsnetwork.io/reddit&scope=*&state=state&code_challenge=challenge&code_challenge_method=plain&duration=permanent"

  public static TOKEN: string = "https://www.reddit.com/api/v1/access_token"
  public static BASE: string = "https://oauth.reddit.com"
  public static REDDIT_SUBMIT: string = RedditApi.BASE + "/api/submit"
  public static subreddits = RedditApi.BASE + "/subreddits/mine/subscriber"
}