// Neural Network Visualization
const canvas = document.getElementById("neural-network");
const ctx = canvas.getContext("2d");

// Controls
const layersInput = document.getElementById("layers");
const neuronsInput = document.getElementById("neurons");
const activationSelect = document.getElementById("activation");
const animationSpeedInput = document.getElementById("animation-speed");
const nodeColorInput = document.getElementById("node-color");
const edgeColorInput = document.getElementById("edge-color");
const glowIntensityInput = document.getElementById("glow-intensity");
const resetButton = document.getElementById("reset");

// Value displays
const layersValue = document.getElementById("layers-value");
const neuronsValue = document.getElementById("neurons-value");
const speedValue = document.getElementById("speed-value");
const glowValue = document.getElementById("glow-value");

const tooltip = document.getElementById("tooltip");

// Initialize network
let network = {
  layers: 3,
  neurons: 5,
  activation: "random",
  animationSpeed: 1,
  nodeColor: "#00b0ff",
  edgeColor: "#4f5b62",
  glowIntensity: 1.0,
  nodes: [],
  edges: [],
  activations: [],
};

// Handle window resize
function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  createNetwork();
  drawNetwork();
}

// Create neural network structure
function createNetwork() {
  network.nodes = [];
  network.edges = [];
  network.activations = [];

  const layerSpacing = canvas.width / (network.layers + 1);
  const maxNeurons = network.neurons;

  // Create nodes
  for (let layer = 0; layer < network.layers; layer++) {
    const neuronsInLayer =
      layer === 0 || layer === network.layers - 1
        ? Math.max(2, Math.floor(maxNeurons / 1.5))
        : maxNeurons;
    const neuronSpacing = canvas.height / (neuronsInLayer + 1);

    for (let n = 0; n < neuronsInLayer; n++) {
      const x = (layer + 1) * layerSpacing;
      const y = (n + 1) * neuronSpacing;

      network.nodes.push({
        x,
        y,
        layer,
        index: n,
        radius: 8,
        activation: 0,
      });

      // Initialize with zero activations
      if (!network.activations[layer]) {
        network.activations[layer] = [];
      }
      network.activations[layer][n] = 0;
    }
  }

  // Create edges (connections)
  for (let i = 0; i < network.nodes.length; i++) {
    const node = network.nodes[i];

    // Connect to all nodes in next layer
    if (node.layer < network.layers - 1) {
      const nextLayerNodes = network.nodes.filter(
        (n) => n.layer === node.layer + 1
      );

      for (let j = 0; j < nextLayerNodes.length; j++) {
        const targetNode = nextLayerNodes[j];

        network.edges.push({
          source: node,
          target: targetNode,
          weight: Math.random() * 2 - 1, // Random weight between -1 and 1
          signalPosition: 0,
          signalActive: false,
          animationProgress: 0,
        });
      }
    }
  }
}

// Animate activations based on selected pattern
function updateActivations() {
  switch (network.activation) {
    case "random":
      // Randomly activate nodes
      for (let layer = 0; layer < network.layers; layer++) {
        const nodesInLayer = network.nodes.filter((n) => n.layer === layer);
        for (let i = 0; i < nodesInLayer.length; i++) {
          if (Math.random() < 0.01 * network.animationSpeed) {
            network.activations[layer][i] = 1;

            // Propagate activation to next layer's connections
            if (layer < network.layers - 1) {
              const connections = network.edges.filter(
                (e) => e.source.layer === layer && e.source.index === i
              );

              connections.forEach((conn) => {
                conn.signalActive = true;
                conn.animationProgress = 0;
              });
            }
          }
        }
      }
      break;

    case "wave":
      // Create a wave pattern
      const time = Date.now() / 1000;
      for (let layer = 0; layer < network.layers; layer++) {
        const nodesInLayer = network.nodes.filter((n) => n.layer === layer);
        for (let i = 0; i < nodesInLayer.length; i++) {
          network.activations[layer][i] =
            0.5 +
            0.5 * Math.sin(time * network.animationSpeed + layer + i * 0.5);

          // Trigger signal on strong activation
          if (
            network.activations[layer][i] > 0.8 &&
            layer < network.layers - 1
          ) {
            const connections = network.edges.filter(
              (e) => e.source.layer === layer && e.source.index === i
            );

            connections.forEach((conn) => {
              if (!conn.signalActive) {
                conn.signalActive = true;
                conn.animationProgress = 0;
              }
            });
          }
        }
      }
      break;

    case "sequential":
      // Sequential activation through layers
      const seqTime =
        (Date.now() % (5000 / network.animationSpeed)) /
        (5000 / network.animationSpeed);
      const activeLayer = Math.floor(seqTime * network.layers);

      for (let layer = 0; layer < network.layers; layer++) {
        const nodesInLayer = network.nodes.filter((n) => n.layer === layer);

        for (let i = 0; i < nodesInLayer.length; i++) {
          if (layer === activeLayer) {
            network.activations[layer][i] =
              0.8 +
              0.2 * Math.sin((Date.now() / 200) * network.animationSpeed + i);

            // Propagate to next layer
            if (
              layer < network.layers - 1 &&
              network.activations[layer][i] > 0.9
            ) {
              const connections = network.edges.filter(
                (e) => e.source.layer === layer && e.source.index === i
              );

              connections.forEach((conn) => {
                if (!conn.signalActive) {
                  conn.signalActive = true;
                  conn.animationProgress = 0;
                }
              });
            }
          } else {
            // Slowly fade out
            network.activations[layer][i] *= 0.95;
          }
        }
      }
      break;
  }

  // Update node activations
  network.nodes.forEach((node) => {
    if (
      network.activations[node.layer] &&
      network.activations[node.layer][node.index] !== undefined
    ) {
      node.activation = network.activations[node.layer][node.index];
    }
  });

  // Update edge animations
  network.edges.forEach((edge) => {
    if (edge.signalActive) {
      edge.animationProgress += 0.02 * network.animationSpeed;

      if (edge.animationProgress >= 1) {
        edge.signalActive = false;
        edge.animationProgress = 0;

        // Activate target node
        if (edge.target.layer < network.layers) {
          network.activations[edge.target.layer][edge.target.index] = 1;
        }
      }
    }
  });
}

// Draw the background grid
function drawGrid() {
  const gridSize = 20;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;

  // Draw vertical lines
  for (let x = 0; x <= canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y <= canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

// Draw network
function drawNetwork() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  let hoverTarget = null;
  let isHoveringInteractive = false;

  network.edges.forEach((edge) => {
    const baseColor = hexToRgb(network.edgeColor);
    const strokeWidth = edge.weight > 0 ? 1 + edge.weight : 0.5;

    ctx.beginPath();
    ctx.moveTo(edge.source.x, edge.source.y);
    ctx.lineTo(edge.target.x, edge.target.y);
    ctx.strokeStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, 0.3)`;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    if (edge.signalActive) {
      const start = { x: edge.source.x, y: edge.source.y };
      const end = { x: edge.target.x, y: edge.target.y };
      const signalPos = {
        x: start.x + (end.x - start.x) * edge.animationProgress,
        y: start.y + (end.y - start.y) * edge.animationProgress,
      };

      ctx.beginPath();
      ctx.moveTo(edge.source.x, edge.source.y);
      ctx.lineTo(edge.target.x, edge.target.y);
      const nodeColor = hexToRgb(network.nodeColor);
      ctx.strokeStyle = `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, 0.3)`;
      ctx.lineWidth = strokeWidth * 2;
      ctx.stroke();

      const gradientSize = 10 * network.glowIntensity;
      const gradient = ctx.createRadialGradient(
        signalPos.x,
        signalPos.y,
        0,
        signalPos.x,
        signalPos.y,
        gradientSize
      );
      gradient.addColorStop(
        0,
        `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, 0.8)`
      );
      gradient.addColorStop(
        1,
        `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, 0)`
      );

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(signalPos.x, signalPos.y, gradientSize, 0, Math.PI * 2);
      ctx.fill();
    }

    if (isPointNearLine(mouseX, mouseY, edge.source, edge.target, 10)) {
      hoverTarget = {
        type: "edge",
        data: edge,
        x: (edge.source.x + edge.target.x) / 2,
        y: (edge.source.y + edge.target.y) / 2,
      };
      isHoveringInteractive = true;
    }
  });

  network.nodes.forEach((node) => {
    const nodeColor = hexToRgb(network.nodeColor);

    if (node.activation > 0.1) {
      const glowSize =
        node.radius * (1.5 + node.activation * network.glowIntensity);
      const gradient = ctx.createRadialGradient(
        node.x,
        node.y,
        node.radius,
        node.x,
        node.y,
        glowSize
      );
      gradient.addColorStop(
        0,
        `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${
          0.3 * node.activation
        })`
      );
      gradient.addColorStop(
        1,
        `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, 0)`
      );

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    const alpha = 0.2 + node.activation * 0.8;
    ctx.fillStyle = `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${alpha})`;
    ctx.fill();

    const innerGradient = ctx.createRadialGradient(
      node.x - node.radius * 0.3,
      node.y - node.radius * 0.3,
      0,
      node.x,
      node.y,
      node.radius
    );
    innerGradient.addColorStop(
      0,
      `rgba(255, 255, 255, ${0.3 * node.activation})`
    );
    innerGradient.addColorStop(
      1,
      `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, 0)`
    );

    ctx.fillStyle = innerGradient;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(${nodeColor.r}, ${nodeColor.g}, ${nodeColor.b}, ${
      0.7 + 0.3 * node.activation
    })`;
    ctx.stroke();

    const dist = Math.sqrt((mouseX - node.x) ** 2 + (mouseY - node.y) ** 2);
    if (dist < node.radius + 5) {
      hoverTarget = { type: "node", data: node, x: node.x, y: node.y };
      isHoveringInteractive = true;
    }
  });

  canvas.style.cursor = isHoveringInteractive ? "pointer" : "default";

  if (hoverTarget) {
    tooltip.classList.add("visible");

    if (hoverTarget.type === "node") {
      const layerType =
        hoverTarget.data.layer === 0
          ? "Input"
          : hoverTarget.data.layer === network.layers - 1
          ? "Output"
          : "Hidden";
      tooltip.innerHTML = `${layerType} Layer Node<br>Activation: ${(
        hoverTarget.data.activation * 100
      ).toFixed(0)}%`;
    } else if (hoverTarget.type === "edge") {
      tooltip.innerHTML = `Connection<br>Weight: ${hoverTarget.data.weight.toFixed(
        2
      )}<br>Signal: ${hoverTarget.data.signalActive ? "Active" : "Inactive"}`;
    }

    let tooltipX = hoverTarget.x + 10;
    let tooltipY = hoverTarget.y - 10;

    const tooltipWidth = tooltip.offsetWidth || 200;
    const tooltipHeight = tooltip.offsetHeight || 40;

    if (tooltipX + tooltipWidth > canvas.width) {
      tooltipX = Math.max(0, hoverTarget.x - tooltipWidth - 10);
    }
    if (tooltipY < tooltipHeight) {
      tooltipY = hoverTarget.y + 20;
    } else if (tooltipY + tooltipHeight > canvas.height) {
      tooltipY = canvas.height - tooltipHeight;
    }

    tooltip.style.left = `${tooltipX}px`;
    tooltip.style.top = `${tooltipY}px`;
  } else {
    tooltip.classList.remove("visible");
  }
}

// Add mouse tracking
let mouseX = 0;
let mouseY = 0;

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Helper function to check if point is near a line
function isPointNearLine(px, py, source, target, threshold) {
  const { x: x1, y: y1 } = source;
  const { x: x2, y: y2 } = target;

  // Distance from point to line
  const distToLine =
    Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1) /
    Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

  // Check if point is within line segment bounds (with padding)
  const minX = Math.min(x1, x2) - threshold;
  const maxX = Math.max(x1, x2) + threshold;
  const minY = Math.min(y1, y2) - threshold;
  const maxY = Math.max(y1, y2) + threshold;

  const withinBounds = px >= minX && px <= maxX && py >= minY && py <= maxY;

  return distToLine <= threshold && withinBounds;
}

// Animation loop
function animate() {
  updateActivations();
  drawNetwork();
  requestAnimationFrame(animate);
}

// Update UI values
function updateUIValues() {
  layersValue.textContent = network.layers;
  neuronsValue.textContent = network.neurons;
  speedValue.textContent = network.animationSpeed.toFixed(1);
  glowValue.textContent = network.glowIntensity.toFixed(1);
}

// Event listeners
layersInput.addEventListener("input", () => {
  network.layers = parseInt(layersInput.value);
  updateUIValues();
  createNetwork();
});

neuronsInput.addEventListener("input", () => {
  network.neurons = parseInt(neuronsInput.value);
  updateUIValues();
  createNetwork();
});

activationSelect.addEventListener("change", () => {
  network.activation = activationSelect.value;
  // Reset activations
  for (let layer = 0; layer < network.activations.length; layer++) {
    for (let i = 0; i < network.activations[layer].length; i++) {
      network.activations[layer][i] = 0;
    }
  }
});

animationSpeedInput.addEventListener("input", () => {
  network.animationSpeed = parseFloat(animationSpeedInput.value);
  updateUIValues();
});

nodeColorInput.addEventListener("input", () => {
  network.nodeColor = nodeColorInput.value;
});

edgeColorInput.addEventListener("input", () => {
  network.edgeColor = edgeColorInput.value;
});

glowIntensityInput.addEventListener("input", () => {
  network.glowIntensity = parseFloat(glowIntensityInput.value);
  updateUIValues();
});

resetButton.addEventListener("click", () => {
  // Reset to defaults
  network.layers = 3;
  network.neurons = 5;
  network.activation = "random";
  network.animationSpeed = 1;
  network.nodeColor = "#00b0ff";
  network.edgeColor = "#4f5b62";
  network.glowIntensity = 1.0;

  // Update UI
  layersInput.value = network.layers;
  neuronsInput.value = network.neurons;
  activationSelect.value = network.activation;
  animationSpeedInput.value = network.animationSpeed;
  nodeColorInput.value = network.nodeColor;
  edgeColorInput.value = network.edgeColor;
  glowIntensityInput.value = network.glowIntensity;

  updateUIValues();
  createNetwork();
});

window.addEventListener("resize", resizeCanvas);

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// Initialize and start animation
resizeCanvas();
updateUIValues();
animate();
