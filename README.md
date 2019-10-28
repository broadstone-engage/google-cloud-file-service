# Creating a Signed Temporary Upload

```
const uploadService = new GoogleCloudFileService('bucket-name', 'project-id', 'storage-credentials.json');

// First Argument - Content Type, Second argument Expiry time in microseconds
uploadService.createSignedUpload('image/jpeg', Date.now() + 1000000).then((signedUpload : SignedUpload) => {
    // This returns a SignedUpload object containing;
    return {
        signedUpload.writeUrl, // the write url for uploading the file via a PUT HTTP request
        signedUpload.readUrl, // the read url for when a file has been uploaded
        signedUpload.fileName // the fileName to use as reference when storing the temporary file permanently
    }
});

```

# Storing an uploaded temporary file

```
// First argument (fileName generated when using createSignedUpload)
// Second argument (destination folder)
uploadService.storeTemporaryFile(item.fileName, 'proof').then((item: storage.File) => {
    // Save item.name to DB as an example
});
```
