import * as grpc from '@grpc/grpc-js';
import { locationProto } from '../config/grpc.js';
import { getNearbyDrivers } from './location.handler.js';

export const startGrpcServer = () => {
    const server = new grpc.Server();

    server.addService(locationProto.LocationService.service, {
        GetNearbyDrivers: getNearbyDrivers,
    });

    const PORT = process.env.GRPC_PORT || '50051';
    const BIND_ADDRESS = `0.0.0.0:${PORT}`;

    server.bindAsync(
        BIND_ADDRESS,
        grpc.ServerCredentials.createInsecure(),
        (err, port) => {
            if (err) {
                console.error(`[gRPC] Failed to bind server: ${err.message}`);
                return;
            }
            console.log(`[gRPC] Location Service running on port :${port}`);
        }
    );
};