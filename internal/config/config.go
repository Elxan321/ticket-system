package config

import "os"

type Config struct {
	Debug bool
}

func Load() Config {
	return Config{
		Debug: os.Getenv("DEBUG") == "1",
	}
}
