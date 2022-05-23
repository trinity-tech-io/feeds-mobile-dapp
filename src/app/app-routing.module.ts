import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./pages/feeds/feeds.module').then(
        m => m.FeedsPageModule,
      ),
  },
  {
    path: 'tabs',
    loadChildren: () =>
      import('./pages/feeds/feeds.module').then(
        m => m.FeedsPageModule,
      ),
  },
  {
    path: 'signin',
    loadChildren: () =>
      import('./pages/signin/signin.module').then(
        m => m.SigninPageModule,
      ),
  },
  {
    path: 'createnewfeed',
    loadChildren: () =>
      import('./pages/feeds/createnewfeed/createnewfeed.module').then(
        m => m.CreatenewfeedPageModule,
      ),
  },
  {
    path: 'createnewpost',
    loadChildren: () =>
      import('./pages/feeds/createnewpost/createnewpost.module').then(
        m => m.CreatenewpostPageModule,
      ),
  },
  {
    path: 'profileimage',
    loadChildren: () =>
      import('./pages/feeds/profileimage/profileimage.module').then(
        m => m.ProfileimagePageModule,
      ),
  },
  {
    path: 'channels/:destDid/:channelId/:isSubscribed',
    loadChildren: () =>
      import('./pages/feeds/home/channels/channels.module').then(
        m => m.ChannelsPageModule,
      ),
  },
  {
    path: 'postdetail/:destDid/:channelId/:postId',
    loadChildren: () =>
      import('./pages/feeds/home/postdetail/postdetail.module').then(
        m => m.PostdetailPageModule,
      ),
  },
  {
    path: 'menu/profiledetail',
    loadChildren: () =>
      import('./pages/feeds/menu/profiledetail/profiledetail.module').then(
        m => m.ProfiledetailPageModule,
      ),
  },
  {
    path: 'menu/about',
    loadChildren: () =>
      import('./pages/about/about.module').then(
        m => m.AboutPageModule,
      ),
  },
  {
    path: 'disclaimer',
    loadChildren: () =>
      import('./pages/disclaimer/disclaimer.module').then(
        m => m.DisclaimerPageModule,
      ),
  },
  {
    path: 'eidtchannel',
    loadChildren: () =>
      import('./pages/eidtchannel/eidtchannel.module').then(
        m => m.EidtchannelPageModule,
      ),
  },
  {
    path: 'editpost',
    loadChildren: () =>
      import('./pages/editpost/editpost.module').then(
        m => m.EditPostPageModule,
      ),
  },
  {
    path: 'editcomment',
    loadChildren: () =>
      import('./pages/editcomment/editcomment.module').then(
        m => m.EditCommentPageModule,
      ),
  },
  {
    path: 'settings',
    loadChildren: () =>
      import('./pages/settings/settings.module').then(
        m => m.SettingsPageModule,
      ),
  },
  {
    path: 'editimage',
    loadChildren: () =>
      import('./pages/editimage/editimage.module').then(
        m => m.EditimagePageModule,
      ),
  },
  {
    path: 'discoverfeedinfo',
    loadChildren: () =>
      import('./pages/discoverfeedinfo/discoverfeedinfo.module').then(
        m => m.DiscoverfeedinfoPageModule,
      ),
  },
  {
    path: 'feedinfo',
    loadChildren: () =>
      import('./pages/feedinfo/feedinfo.module').then(
        m => m.FeedinfoPageModule,
      ),
  },
  {
    path: 'commentlist',
    loadChildren: () =>
      import('./pages/commentlist/commentlist.module').then(
        m => m.CommentlistPageModule,
      ),
  },
  {
    path: 'feedspreferences',
    loadChildren: () =>
      import('./pages/feedspreferences/feedspreferences.module').then(
        m => m.FeedspreferencesPageModule,
      ),
  },
  {
    path: 'language',
    loadChildren: () =>
      import('./pages/settings/language/language.module').then(
        m => m.LanguagePageModule,
      ),
  },
  {
    path: 'mintnft',
    loadChildren: () =>
      import('./pages/nft/mintnft/mintnft.module').then(
        m => m.MintnftPageModule,
      ),
  },
  {
    path: 'assetdetails',
    loadChildren: () =>
      import('./pages/nft/assetdetails/assetdetails.module').then(
        m => m.AssetdetailsPageModule,
      ),
  },
  {
    path: 'bid',
    loadChildren: () =>
      import('./pages/nft/bid/bid.module').then(
        m => m.BidPageModule,
      ),
  },
  {
    path: 'channelsviewall',
    loadChildren: () =>
      import('./pages/feeds/search/search.module').then(
        m => m.SearchPageModule,
      ),
  },
  {
    path: 'learnmore',
    loadChildren: () =>
      import('./pages/learnmore/learnmore.module').then(
        m => m.LearnmorePageModule,
      ),
  },
  {
    path: 'walletteach',
    loadChildren: () =>
      import('./pages/walletteach/walletteach.module').then(
        m => m.WalletteachPageModule,
      ),
  },
  {
    path: 'subscriptions',
    loadChildren: () =>
      import('./pages/subscriptions/subscriptions.module').then(
        m => m.SubscriptionsPageModule,
      ),
  },
  {
    path: 'elastosapiprovider',
    loadChildren: () =>
      import('./pages/elastosapiprovider/elastosapiprovider.module').then(
        m => m.ElastosapiproviderPageModule,
      ),
  },
  {
    path: 'profilenftimage',
    loadChildren: () =>
      import('./pages/profilenftimage/profilenftimage.module').then(
        m => m.ProfilenftimagePageModule,
      ),
  },
  {
    path: 'editprofileimage',
    loadChildren: () =>
      import('./pages/editprofileimage/editprofileimage.module').then(
        m => m.EditprofileimagePageModule,
      ),
  },
  {
    path: 'developer',
    loadChildren: () => import('./pages/developer/developer.module').then(m => m.DeveloperPageModule)
  },
  {
    path: 'select-net',
    loadChildren: () => import('./pages/select-net/select-net.module').then(m => m.SelectNetPageModule)
  },
  {
    path: 'nftavatarlist',
    loadChildren: () => import('./pages/nftavatarlist/nftavatarlist.module').then(m => m.NftavatarlistPageModule)
  },
  {
    path: 'whitelist',
    loadChildren: () => import('./pages/whitelist/whitelist.module').then(m => m.WhitelistPageModule)
  },
  {
    path: 'datastorage',
    loadChildren: () => import('./pages/settings/datastorage/datastorage.module').then(m => m.DatastoragePageModule)
  },
  {
    path: 'galleriachannel',
    loadChildren: () => import('./pages/galleriachannel/galleriachannel.module').then(m => m.GalleriachannelPageModule)
  },
  {
    path: 'scan',
    loadChildren: () => import('./pages/scan/scan.module').then(m => m.ScanPageModule)
  },
  {
    path: 'migrationdata',
    loadChildren: () => import('./pages/settings/migrationdata/migrationdata.module').then(m => m.MigrationdataPageModule)
  },
  {
    path: 'hive-interface-test',
    loadChildren: () => import('./pages/hive-interface-test/hive-interface-test.module').then(m => m.HiveInterfaceTestPageModule)
  },
  {
    path: 'galleriahive',
    loadChildren: () => import('./pages/galleriahive/galleriahive.module').then(m => m.GalleriahivePageModule)
  },
  {
    path: 'apppreferences',
    loadChildren: () => import('./pages/apppreferences/apppreferences.module').then(m => m.ApppreferencesPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
