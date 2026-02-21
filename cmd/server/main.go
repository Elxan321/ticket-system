package main

import (
	"ticket-system/internal/db"
	"ticket-system/internal/handlers"
	"ticket-system/internal/middleware"

	"github.com/gin-gonic/gin"
)


func main() {
	r := gin.Default()

	// CORS middleware
	r.Use(middleware.CORSMiddleware())

	db.ConnectDatabase()

	// Public auth routes
	r.POST("/login", handlers.Login)
	r.POST("/register", handlers.Register)

	// Protected ticket routes (require JWT)
	api := r.Group("/api")
	api.Use(middleware.AuthMiddleware())
	{
		api.GET("/session", handlers.GetSessionInfo)
		api.GET("/tickets", handlers.GetTickets)
		api.GET("/tickets/:id", handlers.GetTicket)
		api.POST("/tickets", handlers.CreateTicket)
		api.PUT("/tickets/:id", handlers.UpdateTicket)
		api.PATCH("/tickets/:id/status", handlers.UpdateTicketStatus)
		api.DELETE("/tickets/:id", handlers.DeleteTicket)
	}

	// Change port to 8081 to avoid conflicts
	r.Run(":8081")
}

