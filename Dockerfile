# BUILD STAGE
FROM golang:1.22-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

WORKDIR /app/cmd/server

RUN go build -o server

# RUN STAGE (ÇOX YÜNGÜL)
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/cmd/server/server .

EXPOSE 8081

CMD ["./server"]