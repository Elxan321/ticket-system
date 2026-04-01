FROM golang:1.21-alpine AS build

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
WORKDIR /app/cmd
RUN go build -o server-main server-main.go

FROM alpine:latest
WORKDIR /app

COPY --from=build /app/cmd/server-main .
COPY --from=build /app/tickets.db .
COPY --from=build /app/web ./web

EXPOSE 8081
CMD ["./server-main"]