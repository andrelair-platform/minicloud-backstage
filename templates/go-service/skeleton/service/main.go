package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

var (
	version = "dev"
	commit  = "unknown"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "${{ values.port }}"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	mux.HandleFunc("/readyz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"service": "${{ values.name }}",
			"version": version,
			"commit":  commit,
		})
	})

	log.Printf("${{ values.name }} starting on :%s (version=%s commit=%s)", port, version, commit)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatal(err)
	}
}
