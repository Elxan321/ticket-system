package models

type User struct {
    ID       uint   `json:"id" gorm:"primaryKey"`        // Avtomatik artan ID
    Name     string `json:"name" gorm:"not null"`        // Boş ola bilməz
    Email    string `json:"email" gorm:"not null;unique"`// Unikal və boş ola bilməz
    Password string `json:"password" gorm:"not null"`    // Hashed şifrə

    Tasks []Task `json:"tasks" gorm:"constraint:OnDelete:CASCADE;"` // 1–N əlaqə
}
