#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// RecocolPhotosPlugin 등록
CAP_PLUGIN(RecocolPhotosPlugin, "RecocolPhotos",
           CAP_PLUGIN_METHOD(fetchPhotos, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getDailyCuration, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(recordCurationAction, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getPhotoMetadata, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadImageData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(deletePhoto, CAPPluginReturnPromise);
)
