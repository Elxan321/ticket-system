package db

import (
	"log"

	"ticket-system/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	_ "modernc.org/sqlite"
)

var DB *gorm.DB

func ConnectDatabase() {
	database, err := gorm.Open(sqlite.Open("tickets.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Database connect error:", err)
	}

	err = database.AutoMigrate(&models.User{}, &models.Task{})
	if err != nil {
		log.Fatal("Migration error:", err)
	}

	DB = database
	log.Println("Database connected successfully")
}

// :=   &  []
