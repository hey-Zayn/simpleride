import path from 'path';
import { fileURLToPath } from 'url';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../proto/location.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const locationProto = grpc.loadPackageDefinition(packageDefinition).location;

// gRPC Server Target: fallback to location-service:50051 for Docker networking
const GRPC_TARGET = process.env.LOCATION_SERVICE_GRPC_URL || 'location-service:50051';

export const locationClient = new locationProto.LocationService(
    GRPC_TARGET,
    grpc.credentials.createInsecure()
);

/**
 * Promisified gRPC Call to Get Nearby Drivers with Timeout & Fallback
 */
export const getNearbyDriversRPC = (requestData, timeoutMs = 3000) => {
    return new Promise((resolve) => {
        // Set deadline for RPC request
        const deadline = new Date(Date.now() + timeoutMs);

        locationClient.GetNearbyDrivers(
            requestData,
            { deadline },
            (error, response) => {
                if (error) {
                    console.error(`[gRPC Client Error] Failed to fetch drivers: ${error.message}`);
                    // Fallback to empty array on error/timeout so ride creation doesn't hard-crash
                    return resolve([]);
                }
                resolve(response.drivers || []);
            }
        );
    });
};