#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// RecocolPhotosPlugin 등록
CAP_PLUGIN(RecocolPhotosPlugin, "RecocolPhotosPlugin",
           CAP_PLUGIN_METHOD(fetchPhotos, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getPhotoMetadata, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(loadImageData, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(deletePhoto, CAPPluginReturnPromise);
)
