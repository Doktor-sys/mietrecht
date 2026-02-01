# Kubernetes Auto-Scaling Configuration

This document describes the Kubernetes Horizontal Pod Autoscaler (HPA) configuration for the Mietrecht Agent system to enable automatic scaling based on resource utilization.

## Overview

Auto-scaling is crucial for maintaining application performance and cost efficiency in Kubernetes environments. This configuration enables automatic scaling of the backend service based on CPU and memory utilization metrics.

## Horizontal Pod Autoscaler (HPA)

The Horizontal Pod Autoscaler automatically scales the number of pods in a deployment based on observed CPU and memory utilization.

### Configuration Details

The HPA configuration is defined in `k8s/backend-hpa.yaml`:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: smartlaw-backend-hpa
  namespace: default
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: smartlaw-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
```

### Scaling Policies

#### Scale-Up Policy
- **Stabilization Window**: 60 seconds
- **Scale by Percentage**: 50% of current replicas every 60 seconds
- **Scale by Pod Count**: 2 additional pods every 60 seconds
- **Selection Policy**: Maximum of the two policies

#### Scale-Down Policy
- **Stabilization Window**: 300 seconds (5 minutes)
- **Scale by Percentage**: 10% of current replicas every 60 seconds

### Resource Metrics

#### CPU Utilization
- **Target**: 70% average CPU utilization
- **Metric Type**: Resource utilization percentage

#### Memory Utilization
- **Target**: 80% average memory utilization
- **Metric Type**: Resource utilization percentage

## Deployment Configuration

The backend deployment (`k8s/backend.yaml`) has been updated to support autoscaling:

1. **Resource Requests and Limits**: Defined CPU and memory resources for accurate metric collection
2. **Metrics Environment Variable**: Enabled metrics collection for autoscaling

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
env:
- name: METRICS_ENABLED
  value: "true"
```

## Scaling Behavior

### Minimum Replicas
- **Count**: 2 replicas
- **Purpose**: Ensures baseline availability and handles normal traffic

### Maximum Replicas
- **Count**: 10 replicas
- **Purpose**: Prevents unbounded scaling while handling traffic spikes

### Scale-Up Triggers
1. CPU utilization exceeds 70%
2. Memory utilization exceeds 80%
3. Traffic load increases beyond current capacity

### Scale-Down Conditions
1. CPU utilization drops below 70% for sustained period
2. Memory utilization drops below 80% for sustained period
3. Traffic load decreases significantly

## Monitoring and Metrics

### Required Components
1. **Metrics Server**: Collects resource metrics from kubelets
2. **Prometheus** (optional): Enhanced metrics collection
3. **Resource Quotas**: Prevents resource exhaustion

### Metric Collection
- CPU usage per pod
- Memory usage per pod
- Network I/O metrics
- Storage I/O metrics

## Deployment Commands

### Apply HPA Configuration
```bash
kubectl apply -f k8s/backend-hpa.yaml
```

### View HPA Status
```bash
kubectl get hpa
kubectl describe hpa smartlaw-backend-hpa
```

### View Scaling Events
```bash
kubectl describe deployment smartlaw-backend
```

### Delete HPA
```bash
kubectl delete hpa smartlaw-backend-hpa
```

## Best Practices

### Resource Configuration
1. Set appropriate resource requests and limits
2. Monitor actual resource usage to optimize configurations
3. Use namespace resource quotas to prevent resource exhaustion

### Scaling Configuration
1. Set conservative scaling thresholds to prevent thrashing
2. Use stabilization windows to prevent rapid scaling fluctuations
3. Define maximum replica counts to control costs

### Monitoring
1. Monitor HPA metrics and scaling events
2. Set up alerts for scaling activities
3. Regularly review and adjust scaling policies

## Troubleshooting

### Common Issues

#### HPA Not Scaling
1. Check if metrics server is running:
   ```bash
   kubectl top nodes
   kubectl top pods
   ```

2. Verify resource metrics are available:
   ```bash
   kubectl get --raw "/apis/metrics.k8s.io/v1beta1/namespaces/default/pods"
   ```

3. Check HPA status:
   ```bash
   kubectl describe hpa smartlaw-backend-hpa
   ```

#### Scaling Too Aggressively
1. Increase stabilization windows
2. Lower scaling percentages
3. Adjust target utilization thresholds

#### Scaling Too Slowly
1. Decrease stabilization windows
2. Increase scaling percentages
3. Lower target utilization thresholds

### Debugging Commands

```bash
# Check HPA status
kubectl get hpa smartlaw-backend-hpa -o yaml

# Check deployment status
kubectl get deployment smartlaw-backend -o yaml

# Check pod resource usage
kubectl top pods -l app=smartlaw-backend

# Check events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Performance Considerations

### Resource Overhead
- HPA controller has minimal overhead
- Metrics collection adds slight overhead to cluster
- Pod creation/deletion has temporary resource impact

### Scaling Latency
- Scale-up: Typically 1-2 minutes after threshold breach
- Scale-down: Typically 5-10 minutes after threshold recovery
- Warm-up time for new pods affects responsiveness

## Cost Optimization

### Resource Efficiency
1. Right-size resource requests and limits
2. Use spot instances for flexible workloads
3. Implement pod disruption budgets for controlled scaling

### Scaling Boundaries
1. Set appropriate min/max replica counts
2. Use cluster autoscaler for node-level scaling
3. Monitor and adjust based on actual usage patterns

## Future Enhancements

Planned improvements for Kubernetes autoscaling:

1. **Custom Metrics Scaling**: Scale based on application-specific metrics
2. **Predictive Scaling**: Anticipate load changes based on historical patterns
3. **Multi-dimensional Scaling**: Consider multiple metrics simultaneously
4. **Vertical Pod Autoscaler**: Automatically adjust resource requests/limits
5. **Cluster Autoscaler Integration**: Automatically adjust node count based on pod demands