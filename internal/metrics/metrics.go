package metrics

import (
	"net/http"
	"strconv"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/collectors"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Recorder struct {
	registry      *prometheus.Registry
	requests      *prometheus.CounterVec
	duration      *prometheus.HistogramVec
	uploadedBytes prometheus.Counter
	uploadCount   prometheus.Counter
	downloadCount prometheus.Counter
}

func New() *Recorder {
	registry := prometheus.NewRegistry()
	registry.MustRegister(collectors.NewGoCollector(), collectors.NewProcessCollector(collectors.ProcessCollectorOpts{}))
	factory := promauto.With(registry)

	return &Recorder{
		registry: registry,
		requests: factory.NewCounterVec(prometheus.CounterOpts{
			Name: "instant_cast_http_requests_total",
			Help: "HTTP requests by method, route, and status.",
		}, []string{"method", "route", "status"}),
		duration: factory.NewHistogramVec(prometheus.HistogramOpts{
			Name:    "instant_cast_http_request_duration_seconds",
			Help:    "HTTP request duration by method, route, and status.",
			Buckets: prometheus.DefBuckets,
		}, []string{"method", "route", "status"}),
		uploadedBytes: factory.NewCounter(prometheus.CounterOpts{
			Name: "instant_cast_uploaded_encrypted_bytes_total",
			Help: "Total encrypted bytes uploaded.",
		}),
		uploadCount: factory.NewCounter(prometheus.CounterOpts{
			Name: "instant_cast_uploads_total",
			Help: "Total encrypted uploads accepted.",
		}),
		downloadCount: factory.NewCounter(prometheus.CounterOpts{
			Name: "instant_cast_share_downloads_total",
			Help: "Total encrypted blob downloads.",
		}),
	}
}

func (r *Recorder) Handler() http.Handler {
	return promhttp.HandlerFor(r.registry, promhttp.HandlerOpts{})
}

func (r *Recorder) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		started := time.Now()
		recorder := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(recorder, req)
		route := req.URL.Path
		status := strconv.Itoa(recorder.status)
		r.requests.WithLabelValues(req.Method, route, status).Inc()
		r.duration.WithLabelValues(req.Method, route, status).Observe(time.Since(started).Seconds())
	})
}

func (r *Recorder) RecordUpload(bytes int64) {
	r.uploadCount.Inc()
	r.uploadedBytes.Add(float64(bytes))
}

func (r *Recorder) RecordDownload() {
	r.downloadCount.Inc()
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(status int) {
	r.status = status
	r.ResponseWriter.WriteHeader(status)
}
