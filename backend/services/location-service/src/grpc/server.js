import * as grpc from '@grpc/grpc-js';
import { locationProto } from '../config/grpc.js';
import { getNearbyDrivers } from './location.handler.js';

let grpcServer = null;
export const startGrpcServer = () => new Promise((resolve, reject) => {
    grpcServer = new grpc.Server();
    grpcServer.addService(locationProto.LocationService.service, { GetNearbyDrivers: getNearbyDrivers });
    const port = process.env.GRPC_PORT || '50051';
    grpcServer.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (error, boundPort) => {
        if (error) return reject(error);
        grpcServer.start();
        console.log(`[gRPC] Location Service listening on port ${boundPort}`);
        resolve();
    });
});
export const stopGrpcServer = () => new Promise((resolve) => {
    if (!grpcServer) return resolve();
    grpcServer.tryShutdown(resolve);
});