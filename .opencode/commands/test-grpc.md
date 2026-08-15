# Command: test-grpc

## Description

Tests binary gRPC communication between Ride Service and Location Service for driver discovery.

## Execution Steps

1. Verify Protobuf definitions in `backend/services/location-service/proto/location.proto` match `backend/services/ride-service/proto/location.proto`.
2. Ensure Location Service gRPC server is listening on port `:50051`.
3. Run driver geospatial discovery test payload against gRPC endpoint `FindNearbyDrivers`.
