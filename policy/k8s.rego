package main

# Deny any Deployment that has no livenessProbe on the first container
deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[0]
  not container.livenessProbe
  msg = sprintf(
    "Deployment '%s' must have a livenessProbe on container '%s'",
    [input.metadata.name, container.name]
  )
}

# Deny any Deployment where imagePullPolicy is not Always
deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[0]
  container.imagePullPolicy != "Always"
  msg = sprintf(
    "Deployment '%s' container '%s' must set imagePullPolicy: Always",
    [input.metadata.name, container.name]
  )
}

# Deny any Deployment that has no resource limits defined
deny[msg] {
  input.kind == "Deployment"
  container := input.spec.template.spec.containers[0]
  not container.resources.limits
  msg = sprintf(
    "Deployment '%s' container '%s' must define resource limits",
    [input.metadata.name, container.name]
  )
}