package handlers

import "net/http"

// error qaytaran handler (global handler bunu tutacaq)
func PingHandler(w http.ResponseWriter, r *http.Request) error {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ping OK"))
	return nil
}
