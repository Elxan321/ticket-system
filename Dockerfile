# BUILD STAGE
# Must match go.mod `go` directive (currently >= 1.24); older images fail at `go mod download`.
FROM golang:1.24-alpine AS builder

WORKDIR /app
ENV GOTOOLCHAIN=local

COPY go.mod go.sum ./
RUN go mod download

COPY . .

WORKDIR /app/cmd/server

RUN CGO_ENABLED=0 GOOS=linux go build -o /server

# RUN STAGE (ÇOX YÜNGÜL)
FROM alpine:latest

RUN apk add --no-cache ca-certificates wget

WORKDIR /root/

COPY --from=builder /server ./server

EXPOSE 8081

CMD ["./server"]