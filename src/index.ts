import * as storage from '@google-cloud/storage';
import * as uuid from 'uuid/v4';
import * as mime from 'mime-types';
import { GetSignedUrlResponse } from '@google-cloud/storage';

export class SignedUpload {
    public fileName: string;
    public contentType: string;
    public expiryTime: number;
    public writeUrl: string;
    public readUrl : string;

    constructor(fileName: string, contentType: string, expiryTime: number, writeUrl: string, readUrl: string) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.expiryTime = expiryTime;
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

    async createSignedUrl(file: storage.File, signedUrlConfig : storage.GetSignedUrlConfig) : Promise<string> {
        const response : GetSignedUrlResponse = await file.getSignedUrl(signedUrlConfig);
        return response[0];
    }
    
    async createSignedUpload(contentType: string, expiryTime: number) : Promise<SignedUpload> {
        // Create Temporary File in Temporary Folder
        const temporaryFileName = this.makeFileName(contentType);
        const temporaryFilePath = this.TEMPORARY_FOLDER + "/" + temporaryFileName;
        const file = this.getFile(temporaryFilePath);

        const writeConfig = {
          action: "write",
          expires: expiryTime,
          contentType
        }  as storage.GetSignedUrlConfig;

        const signedWriteUrl = await this.createSignedUrl(file, writeConfig);

        const readConfig = {
            action: "read",
            expires: expiryTime
        }  as storage.GetSignedUrlConfig;

        const signedReadUrl = await this.createSignedUrl(file, readConfig);

        return new SignedUpload(temporaryFileName, contentType, expiryTime, signedWriteUrl, signedReadUrl);
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

    async copyTemporaryFile(temporaryFileName: string, destinationPath: string) : Promise<storage.File> {
        const temporaryFilePath = this.TEMPORARY_FOLDER + '/' + temporaryFileName;
        const temporaryFile = this.getFile(temporaryFilePath);

        const permanentFile = this.getFile(destinationPath);

        const copyResponse = await temporaryFile.copy(permanentFile);

        return copyResponse[0];
    }

    async deleteFile(filePath: string) {
        const file = this.getFile(filePath);

        await file.delete({
            ignoreNotFound: true
        })
    }
}
