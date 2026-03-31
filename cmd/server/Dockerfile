# 1. Build stage
FROM golang:1.21-alpine AS build

WORKDIR /app
# Go mod fayllarını copy edib download edirik
COPY go.mod go.sum ./
RUN go mod download

# Repo-nun qalan hissəsini copy edirik
COPY . .

# Server binary-ni build edirik
RUN go build -o server-main server-main.go

# 2. Final image
FROM alpine:latest
WORKDIR /app

# Backend binary + db copy
COPY --from=build /app/server-main .
COPY ../tickets.db .         # DB root-da yerləşir
COPY ../web ./web            # Frontend faylları container-a copy edilir

EXPOSE 8081
CMD ["./server-main"]