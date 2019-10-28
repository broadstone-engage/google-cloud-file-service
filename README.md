# Package's purpose

This is to prevent lightweight services from having to intake file data in order to store the files, instead we offload this work to google and we simply reference the files stored by an App or third party service.

It also benefits such as;

- Improved upload time (uploading directly to google cloud storage)
- Minimised dev time requiring just configuration, setup and use of the code where appropriate.
- Separates the concern of uploading and managing files away from lightweight services

# Use cases

1. Uploading a file to be saved in a Database using item.name as a reference
2. Uploading a file to be processed by a consuming service

# Creating a Signed Temporary Upload

- Bucket Name = Google Storage Bucket Name
- Project ID = Google Project ID
- Storage Credentials = Google Service Account JSON credentials

```typescript
// First Argument Bucket Name
// Second Argument Project ID
// Third Argument Storage Credentials - File name in current working directory
const uploadService = new GoogleCloudFileService('bucket-name', 'project-id', 'storage-credentials.json');

// First Argument - Content Type
// Second argument Expiry time in microseconds
uploadService.createSignedUpload('image/jpeg', Date.now() + 1000000).then((signedUpload : SignedUpload) => {
    // This returns a SignedUpload object containing;
    return {
        signedUpload.fileName, // the fileName to use as reference when storing the temporary file permanently
        signedUpload.contentType // the file content type used to generate this link
        signedUpload.expiryTime, // the expiry time used to generate this link
        signedUpload.writeUrl, // the write url for uploading the file via a PUT HTTP request
        signedUpload.readUrl // the read url for when a file has been uploaded GET HTTP request
    }
});

```

# Storing an uploaded temporary file

```typescript
// First argument (fileName generated when using createSignedUpload)
// Second argument (destination folder)
uploadService.storeTemporaryFile(item.fileName, 'proof').then((file: storage.File) => {
    // Save item.name to DB as an example
});
```

# Making files public or private

By default files are made private unless specifically set to public, you would achieve this by;

```typescript
// storage.File object from storeTemporaryFile above or getFile method
file.makePublic();
```

# Further Reading
- https://googleapis.dev/nodejs/storage/latest/global.html