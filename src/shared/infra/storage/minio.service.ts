import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private readonly serverUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.serverUrl = this.configService.get<string>("MINIO_SERVER_URL")!;
    this.bucket = this.configService.get<string>("MINIO_BUCKET")!;

    const url = new URL(this.serverUrl);

    this.client = new Minio.Client({
      endPoint: url.hostname,
      port: url.port ? Number.parseInt(url.port) : undefined,
      useSSL: url.protocol === "https:",
      accessKey: this.configService.get<string>("MINIO_ROOT_USER")!,
      secretKey: this.configService.get<string>("MINIO_ROOT_PASSWORD")!,
    });
  }

  async onModuleInit(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);

    if (!exists) {
      await this.client.makeBucket(this.bucket);
      this.logger.log(`Bucket "${this.bucket}" created`);
    }

    this.logger.log(`MinIO connected — bucket "${this.bucket}" ready`);
  }

  async upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      "Content-Type": contentType,
    });

    return this.getFileUrl(key);
  }

  async delete(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  getFileUrl(key: string): string {
    return `${this.serverUrl}/${this.bucket}/${key}`;
  }
}