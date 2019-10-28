import * as storage from '@google-cloud/storage';
import * as uuid from 'uuid/v4';
import * as mime from 'mime-types';

export class SignedUpload {
    public fileName: string;
    public writeUrl: string;
    public readUrl : string;

    constructor(fileName: string, writeUrl: string, readUrl: string) {
        this.fileName = fileName;
        this.writeUrl = writeUrl;
        this.readUrl = readUrl;
    }
}

export class GoogleCloudFileService {
    // Location of Temporary Files
    protected readonly TEMPORARY_FOLDER : string = "temp";
    // Creates a client
    protected storageInstance : storage.Storage;
    // Storage Bucket
    protected bucket : storage.Bucket;
    
    constructor(bucketName: string, projectId: string, keyFilename: string) {
        this.storageInstance = new storage.Storage({
            projectId,
            keyFilename
        });

        this.bucket = this.storageInstance.bucket(bucketName);
    }
    
    getFile(fileName: string) : storage.File {
        return this.bucket.file(fileName);
    }
    
    makeFileName(contentType: string) : string {
        const uniqueString = uuid();
        const extension = mime.extension(contentType);
        return uniqueString + "." + extension;
    }
    
    async createSignedUpload(contentType: string, expires: number) : Promise<SignedUpload> {
        // Create Temporary File in Temporary Folder
        const temporaryFileName = this.makeFileName(contentType);
        const temporaryFilePath = this.TEMPORARY_FOLDER + "/" + temporaryFileName;
        const file = this.getFile(temporaryFilePath);
        
        const writeConfig = {
          action: "write",
          expires,
          contentType
        }  as storage.GetSignedUrlConfig;
        
        const signedWriteUrl = await file.getSignedUrl(writeConfig);
        
        const readConfig = {
          action: "read",
          expires
        }  as storage.GetSignedUrlConfig;
        
        const signedReadUrl = await file.getSignedUrl(readConfig);

        return new SignedUpload(temporaryFileName, signedWriteUrl[0], signedReadUrl[0]);
    }
    
    async storeTemporaryFile(temporaryFileName: string, destinationFolder: string) : Promise<storage.File> {
        const temporaryFilePath = this.TEMPORARY_FOLDER + "/" + temporaryFileName;
        const temporaryFile = this.getFile(temporaryFilePath);

        const contentType = mime.contentType(temporaryFileName) as string;
        const permanentFileName = destinationFolder + "/" + this.makeFileName(contentType);
        const permanentFile = this.getFile(permanentFileName);
        
        const moveResponse = await temporaryFile.move(permanentFile);

        return moveResponse[0];
    }
}