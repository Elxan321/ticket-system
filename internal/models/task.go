package models

import "gorm.io/gorm"

type Task struct {
    gorm.Model
    Title       string `json:"title" gorm:"not null"`
    Description string `json:"description"`
    Status      string `json:"status" gorm:"default:'open'"` // open, in_progress, closed, resolved
    Priority    string `json:"priority" gorm:"default:'normal'"` // low, normal, high, critical
    Category    string `json:"category" gorm:"default:'other'"` // repo, infra, security, bug, feature, other
    UserID      uint   `json:"user_id"` // FK: task-in sahibi
}
