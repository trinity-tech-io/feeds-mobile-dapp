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
    path: 'channels/:destDid/:channelId',
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
    path: 'feedinfo',
    loadChildren: () =>
      import('./pages/feedinfo/feedinfo.module').then(
        m => m.FeedinfoPageModule,
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
    path: 'apppreferences',
    loadChildren: () => import('./pages/apppreferences/apppreferences.module').then(m => m.ApppreferencesPageModule)
  },
  {
    path: 'connections',
    loadChildren: () => import('./pages/connections/connections.module').then( m => m.ConnectionsPageModule)
  },
  {
    path: 'userlist',
    loadChildren: () => import('./pages/userlist/userlist.module').then( m => m.UserlistPageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
