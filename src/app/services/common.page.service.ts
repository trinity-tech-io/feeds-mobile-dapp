import { Injectable } from '@angular/core';
import _, { reject } from 'lodash';
import { UtilService } from './utilService';
import { HiveVaultController } from 'src/app/services/hivevault_controller.service';
import { DataHelper } from './DataHelper';
import { Config } from './config';
@Injectable()
export class CommonPageService {

  public static removeAllAvatar(isLoadAvatarImage: any, elementId: string) {
    let avatarImageIds = isLoadAvatarImage;
    for (let key in avatarImageIds) {
      let value = avatarImageIds[key] || '';
      if (value === '13') {
        let id = key + "-" + elementId;
        let htmlElement: HTMLElement = document.getElementById(id) || null;
        if (htmlElement != null) {
          htmlElement.removeAttribute('src');
          htmlElement.style.display = "none";
        }
      }
    }
  }

  public static handleDisplayUserName(
    id: string,
    isInitUserNameMap: any,
    userNameMap: any,
    hiveVaultController: HiveVaultController,
    ownerDid: string = "",
    channelName?: string,
  ) {
    try {

      let arr = id.split('-');
      let destDid = arr[0];
      let channelId = arr[1];
      let commentId = arr[3];
      let userDid = arr[4];
      let isInit = isInitUserNameMap[commentId] || '';
      if (isInit === '') {
        if (destDid === userDid) {
          isInitUserNameMap[commentId] = "11";
          userNameMap[destDid] = channelName;
          return;
        }

        userNameMap[userDid] = this.indexText(userDid);
        isInitUserNameMap[commentId] = "11";
        hiveVaultController.getUserProfile(userDid).then((userProfile: FeedsData.UserProfile) => {
          const name = userProfile.name || userProfile.resolvedName || userProfile.displayName
          if (name) {
            userNameMap[userDid] = name;
          } else {
            userNameMap[userDid] = this.indexText(userDid);
          }
        }).catch(() => {
          userNameMap[userDid] = this.indexText(userDid);
        });
        // hiveVaultController.getDisplayName(destDid, channelId, userDid).
        //   then((result: string) => {
        //     let name = result || "";
        //     if (name != "") {
        //       userNameMap[userDid] = name;
        //     }
        //   }).catch(() => {
        //     userNameMap[userDid] = this.indexText(userDid);
        //   });
      }

    } catch (error) {
    }
  }

  static indexText(text: string): string {
    text = text || "";
    if (text != '') {
      text = text.replace('did:elastos:', '');
      return UtilService.shortenAddress(text);
    }
  }

  public static likeComment(comment: FeedsData.CommentV3,
    likedCommentMap: any,
    isloadingLikeMap: any,
    likedCommentNum: any,
    hiveVaultController: any,
    dataHelper: DataHelper
  ) {
    new Promise((resolve, reject) => {
      try {

        let destDid = comment.destDid;
        let channelId = comment.channelId;
        let postId = comment.postId;
        let commentId = comment.commentId;
        let isLike = likedCommentMap[commentId] || '';
        let isLikeLoading = isloadingLikeMap[commentId] || ''
        if (isLikeLoading === "loading") {
          return;
        }
        if (isLike === '') {
          try {
            isloadingLikeMap[commentId] = "loading";
            likedCommentMap[commentId] = "like";
            likedCommentNum[commentId] = likedCommentNum[commentId] + 1;

            hiveVaultController.like(destDid, channelId, postId, commentId).then(() => {
              isloadingLikeMap[commentId] = "";
              dataHelper.cacheLikeStatus(postId, commentId, true);
              let likedNum = dataHelper.getCachedLikeNum(postId, commentId) || 0;
              likedNum = likedNum + 1;
              dataHelper.cacheLikeNum(postId, commentId, likedNum)
              resolve("success");
            }).catch(() => {
              likedCommentMap[commentId] = "";
              if (likedCommentNum[commentId] > 0) {
                likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
              }
              isloadingLikeMap[commentId] = "";
            });
          } catch (err) {
            likedCommentMap[commentId] = "";
            if (likedCommentNum[commentId] > 0) {
              likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
            }
            isloadingLikeMap[commentId] = "";
          }
          return;
        }

        if (likedCommentMap[commentId] === "like") {

          try {
            isloadingLikeMap[commentId] = "loading";
            likedCommentNum[commentId] = likedCommentNum[commentId] - 1;
            likedCommentMap[commentId] = "";
            hiveVaultController.removeLike(destDid, channelId, postId, commentId).then(() => {
              isloadingLikeMap[commentId] = "";
              //update cached
              dataHelper.cacheLikeStatus(postId, commentId, false);
              let likedNum = dataHelper.getCachedLikeNum(postId, commentId) || 0;
              if (likedNum > 0) {
                likedNum = likedNum - 1;
              }
              dataHelper.cacheLikeNum(postId, commentId, likedNum);
              resolve("success");
            }).catch(() => {
              likedCommentMap[commentId] = "like";
              likedCommentNum[commentId] = likedCommentNum[commentId] + 1;
              isloadingLikeMap[commentId] = "";

            });
          } catch (error) {
            likedCommentMap[postId] = "like";
            likedCommentNum[commentId] = likedCommentNum[commentId] + 1;
            isloadingLikeMap[commentId] = "";
          }
        }

      } catch (error) {

      }
    });
  }

  public static likePost(
    destDid: string,
    channelId: string,
    postId: string,
    isLoadingLikeMap: any,
    likeMap: any,
    likeNumMap: any,
    hiveVaultController: HiveVaultController,
    dataHelper: DataHelper,
  ) {
    return new Promise((resolve, reject) => {
      let isLoading = isLoadingLikeMap[postId] || '';
      if (isLoading === "loading") {
        return;
      }
      let isLike = likeMap[postId] || '';
      if (isLike === '') {
        try {
          isLoadingLikeMap[postId] = "loading";
          likeMap[postId] = "like";
          likeNumMap[postId] = likeNumMap[postId] + 1;
          hiveVaultController.like(
            destDid, channelId, postId, '0').then(() => {
              isLoadingLikeMap[postId] = "";
              //update cached
              dataHelper.cacheLikeStatus(postId, '0', true);
              let likedNum = dataHelper.getCachedLikeNum(postId, '0') || 0;
              likedNum = likedNum + 1;
              dataHelper.cacheLikeNum(postId, '0', likedNum)
              resolve("success");
            }).catch(err => {

              isLoadingLikeMap[postId] = "";
              likeMap[postId] = "";
              if (likeNumMap[postId] > 0) {
                likeNumMap[postId] = likeNumMap[postId] - 1;
              }
            });
        } catch (err) {
          isLoadingLikeMap[postId] = "";
          likeMap[postId] = "";
          if (likeNumMap[postId] > 0) {
            likeNumMap[postId] = likeNumMap[postId] - 1;
          }
        }

        return;
      }

      if (isLike === "like") {
        try {
          isLoadingLikeMap[postId] = "loading";
          likeMap[postId] = "";
          if (likeNumMap[postId] > 0) {
            likeNumMap[postId] = likeNumMap[postId] - 1;
          }
          hiveVaultController.removeLike(
            destDid, channelId, postId, '0').then(() => {
              isLoadingLikeMap[postId] = "";
              //update cached
              dataHelper.cacheLikeStatus(postId, '0', false);
              let likedNum = dataHelper.getCachedLikeNum(postId, '0') || 0;
              if (likedNum > 0) {
                likedNum = likedNum - 1;
              }
              dataHelper.cacheLikeNum(postId, '0', likedNum);
              resolve("success");
            }).catch((error) => {
              isLoadingLikeMap[postId] = "";
              likeMap[postId] = "like";
              likeNumMap[postId] = likeNumMap[postId] + 1;
            });
        } catch (error) {
          isLoadingLikeMap[postId] = "";
          likeMap[postId] = "like";
          likeNumMap[postId] = likeNumMap[postId] + 1;
        }
      }
    });
  }

  public static handlePostLikeStatusData(
    destDid: string,
    channelId: string,
    postId: string,
    isInitLikeStatus: any,
    hiveVaultController: any,
    likeMap: any,
    isLoadingLikeMap: any
  ) {

    let isInit = isInitLikeStatus[postId] || '';
    if (isInit === '') {
      isInitLikeStatus[postId] = "11";
      this.initPostLikeStatusData(destDid, channelId, postId,
        isLoadingLikeMap, hiveVaultController, likeMap, isInitLikeStatus);
    }
  }

  static initPostLikeStatusData(
    destDid: string, channelId: string, postId: string,
    isLoadingLikeMap: any, hiveVaultController: HiveVaultController,
    likeMap: any, isInitLikeStatus: any
  ) {

    try {
      isLoadingLikeMap[postId] = "loading";
      hiveVaultController.getLikeStatus(postId, '0').then((status) => {
        if (status) {
          likeMap[postId] = "like";
        } else {
          likeMap[postId] = "";
        }
        isLoadingLikeMap[postId] = "";
      }).catch((err) => {
        isLoadingLikeMap[postId] = "";
        isInitLikeStatus[postId] = "";
      });
    } catch (err) {
      isLoadingLikeMap[postId] = "";
      isInitLikeStatus[postId] = "";
    }

  }

  public static handlePostLikeNumData(
    destDid: string, channelId: string, postId: string,
    hiveVaultController: any,
    likeNumMap: any, isInitLikeNum: any
  ) {
    let isInit = isInitLikeNum[postId] || '';
    if (isInit === '') {
      isInitLikeNum[postId] = "11";
      this.initPostLikeNumData(destDid, channelId, postId,
        hiveVaultController, likeNumMap, isInitLikeNum);
    }
  }

  static initPostLikeNumData(
    destDid: string, channelId: string, postId: string,
    hiveVaultController: any, likeNumMap: any,
    isInitLikeNum: any
  ) {
    try {
      hiveVaultController.getLikeNum(
        postId, '0'
      ).then((result) => {
        let listNum = result || 0;
        likeNumMap[postId] = listNum;
      }).catch((err) => {
        isInitLikeNum[postId] = "";
      });
    } catch (err) {
      isInitLikeNum[postId] = "";
    }

  }

  public static handlePostCommentData(
    destDid: string, channelId: string, postId: string,
    hiveVaultController: any,
    isInitComment: any, commentNumMap: any
  ) {
    let isInit = isInitComment[postId] || '';
    if (isInit === '') {
      isInitComment[postId] = "11";
      this.initPostCommentData(destDid, channelId, postId,
        hiveVaultController, isInitComment, commentNumMap
      );
    }
  }
  static initPostCommentData(destDid: string, channelId: string, postId: string,
    hiveVaultController: any, isInitComment: any, commentNumMap: any
  ) {
    try {
      hiveVaultController.getCommentList(
        postId, '0'
      ).then((result: any) => {
        isInitComment[postId] = "13";
        commentNumMap[postId] = result.length;
      }).catch((err) => {
        isInitComment[postId] = "";
      });
    } catch (error) {
      isInitComment[postId] = "";
    }
  }

  public static handleCommentLikeStatus(
    id: string, hiveVaultController: any,
    isInitLikeStatus: any, isloadingLikeMap: any,
    likedCommentMap: any
  ) {
    try {

      let arr = id.split('-');
      let destDid = arr[0];
      let channelId = arr[1];
      let postId = arr[2];
      let commentId = arr[3];
      let isInit = isInitLikeStatus[commentId] || '';
      if (isInit === '') {
        isInitLikeStatus[commentId] = "11";
        this.initCommentLikeStatus(
          destDid,
          channelId,
          postId,
          commentId,
          hiveVaultController,
          isInitLikeStatus,
          isloadingLikeMap,
          likedCommentMap
        );
      }

    } catch (error) {
    }
  }

  static initCommentLikeStatus(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: string,
    hiveVaultController: any,
    isInitLikeStatus: any,
    isloadingLikeMap: any,
    likedCommentMap: any
  ) {
    try {
      isloadingLikeMap[commentId] = "loading"
      hiveVaultController.getLikeStatus(postId, commentId)
        .then((status: boolean) => {
          if (status) {
            likedCommentMap[commentId] = "like";
          } else {
            likedCommentMap[commentId] = "";
          }
          isloadingLikeMap[commentId] = "";
        }).catch((err) => {

          likedCommentMap[commentId] = "";
          isInitLikeStatus[commentId] = "";
          isloadingLikeMap[commentId] = "";
        });
    } catch (err) {

      isloadingLikeMap[commentId] = "";
      likedCommentMap[commentId] = "";
      isInitLikeStatus[commentId] = "";
    }
  }

  public static handleCommentLikeNum(
    id: string, hiveVaultController: any,
    isInitLikeNum: any, likedCommentNum: any
  ) {
    try {

      let arr = id.split('-');
      let destDid = arr[0];
      let channelId = arr[1];
      let postId = arr[2];
      let commentId = arr[3];
      let isInit = isInitLikeNum[commentId] || '';
      if (isInit === '') {
        isInitLikeNum[commentId] = "11";
        this.initCommnetLikeNum(
          destDid,
          channelId,
          postId,
          commentId,
          hiveVaultController,
          isInitLikeNum,
          likedCommentNum,
        );
      }

    } catch (error) {
    }
  }

  static initCommnetLikeNum(
    destDid: string,
    channelId: string,
    postId: string,
    commentId: string,
    hiveVaultController: any,
    isInitLikeNum: any,
    likedCommentNum: any,
  ) {
    try {
      hiveVaultController.getLikeNum(
        postId, commentId
      ).then((likesNum: any) => {
        isInitLikeNum[commentId] = "13";
        likedCommentNum[commentId] = likesNum || 0;
      }).catch((err) => {
        isInitLikeNum[commentId] = "";
      });
    } catch (err) {
      isInitLikeNum[commentId] = "";
    }
  }

  public static handleCommentNum(
    id: string, hiveVaultController: any,
    isInitComment: any, commentNum: any
  ) {
    try {
      let arr = id.split('-');
      let destDid = arr[0];
      let channelId = arr[1];
      let postId = arr[2];
      let commentId = arr[3];
      let isInit = isInitComment[commentId] || '';
      if (isInit === '') {
        isInitComment[commentId] = "11";
        this.initCommentData(
          destDid, channelId,
          postId, commentId,
          hiveVaultController,
          isInitComment,
          commentNum
        );
      }

    } catch (error) {
    }
  }

  static initCommentData(
    destDid: string, channelId: string,
    postId: string, commentId: string,
    hiveVaultController: any, isInitComment: any,
    commentNum: any
  ) {
    try {
      hiveVaultController.
        getCommentList(postId, commentId).
        then((result: any) => {
          result = result || [];
          commentNum[commentId] = result.length || 0;
        }).catch(() => {
          isInitComment[commentId] = "";
        });
    } catch (error) {
      isInitComment[commentId] = "";
    }
  }

}


