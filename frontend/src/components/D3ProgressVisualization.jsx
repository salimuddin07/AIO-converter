import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { colorVariations } from '../utils/polishedHelpers';

const D3ProgressVisualization = ({ 
  progress = 0, 
  total = 100, 
  type = 'circular', // 'circular', 'linear', 'animated-bars', 'wave'
  color = '#1976d2',
  size = 200,
  animated = true,
  showValue = true,
  label = 'Progress',
  data = null // For advanced visualizations
}) => {
  const svgRef = useRef();
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const colorScheme = colorVariations(color);

  // Animate progress changes
  useEffect(() => {
    if (animated) {
      const duration = 1000;
      const steps = 60;
      const increment = (progress - animatedProgress) / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        setAnimatedProgress(prev => prev + increment);
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setAnimatedProgress(progress);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    } else {
      setAnimatedProgress(progress);
    }
  }, [progress, animated]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = size;
    const height = size;
    const centerX = width / 2;
    const centerY = height / 2;

    svg.attr('width', width).attr('height', height);

    switch (type) {
      case 'circular':
        renderCircularProgress();
        break;
      case 'linear':
        renderLinearProgress();
        break;
      case 'animated-bars':
        renderAnimatedBars();
        break;
      case 'wave':
        renderWaveProgress();
        break;
      case 'radial-bars':
        renderRadialBars();
        break;
      default:
        renderCircularProgress();
    }

    function renderCircularProgress() {
      const radius = Math.min(width, height) / 2 - 20;
      const thickness = 12;
      
      // Background circle
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', radius)
        .attr('fill', 'none')
        .attr('stroke', colorScheme.transparent)
        .attr('stroke-width', thickness);

      // Progress arc
      const arc = d3.arc()
        .innerRadius(radius - thickness / 2)
        .outerRadius(radius + thickness / 2)
        .startAngle(0)
        .endAngle(0);

      const progressArc = svg.append('path')
        .datum({ endAngle: 0 })
        .attr('d', arc)
        .attr('fill', `url(#gradient-${type})`)
        .attr('transform', `translate(${centerX}, ${centerY}) rotate(-90)`);

      // Gradient definition
      const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', `gradient-${type}`)
        .attr('gradientUnits', 'userSpaceOnUse');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScheme.lighter);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScheme.darker);

      // Animate progress
      progressArc.transition()
        .duration(animated ? 1000 : 0)
        .attrTween('d', function(d) {
          const interpolate = d3.interpolate(d.endAngle, (animatedProgress / total) * 2 * Math.PI);
          return function(t) {
            d.endAngle = interpolate(t);
            return arc(d);
          };
        });

      // Center text
      if (showValue) {
        const textGroup = svg.append('g')
          .attr('transform', `translate(${centerX}, ${centerY})`);
        
        textGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '-0.1em')
          .style('font-size', `${size * 0.08}px`)
          .style('font-weight', 'bold')
          .style('fill', colorScheme.base)
          .text(`${Math.round(animatedProgress)}%`);
        
        textGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', '1.2em')
          .style('font-size', `${size * 0.05}px`)
          .style('fill', colorScheme.darker)
          .text(label);
      }
    }

    function renderLinearProgress() {
      const barHeight = 20;
      const barWidth = width - 40;
      const x = 20;
      const y = centerY - barHeight / 2;

      // Background bar
      svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', colorScheme.transparent)
        .attr('rx', barHeight / 2);

      // Progress bar
      svg.append('rect')
        .attr('x', x)
        .attr('y', y)
        .attr('width', 0)
        .attr('height', barHeight)
        .attr('fill', `url(#gradient-linear)`)
        .attr('rx', barHeight / 2)
        .transition()
        .duration(animated ? 1000 : 0)
        .attr('width', (animatedProgress / total) * barWidth);

      // Gradient
      const gradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'gradient-linear')
        .attr('x1', '0%')
        .attr('x2', '100%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScheme.lighter);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScheme.darker);

      // Progress text
      if (showValue) {
        svg.append('text')
          .attr('x', centerX)
          .attr('y', y + barHeight + 30)
          .attr('text-anchor', 'middle')
          .style('font-size', '16px')
          .style('font-weight', 'bold')
          .style('fill', colorScheme.base)
          .text(`${Math.round(animatedProgress)}% ${label}`);
      }
    }

    function renderAnimatedBars() {
      const barCount = 20;
      const barWidth = (width - 60) / barCount;
      const barMaxHeight = height - 60;
      const startX = 30;
      const startY = height - 30;

      for (let i = 0; i < barCount; i++) {
        const delay = i * 50;
        const barProgress = Math.max(0, Math.min(1, (animatedProgress / total * barCount - i) / 1));
        
        svg.append('rect')
          .attr('x', startX + i * barWidth + 2)
          .attr('y', startY)
          .attr('width', barWidth - 4)
          .attr('height', 0)
          .attr('fill', d3.interpolateRgb(colorScheme.lighter, colorScheme.darker)(i / barCount))
          .transition()
          .delay(animated ? delay : 0)
          .duration(animated ? 300 : 0)
          .attr('height', barProgress * barMaxHeight)
          .attr('y', startY - barProgress * barMaxHeight);
      }

      if (showValue) {
        svg.append('text')
          .attr('x', centerX)
          .attr('y', 20)
          .attr('text-anchor', 'middle')
          .style('font-size', '18px')
          .style('font-weight', 'bold')
          .style('fill', colorScheme.base)
          .text(`${Math.round(animatedProgress)}% ${label}`);
      }
    }

    function renderWaveProgress() {
      const waveHeight = size * 0.1;
      const waveCount = 3;
      
      // Clip path for wave effect
      const clipPath = svg.append('defs')
        .append('clipPath')
        .attr('id', 'wave-clip');
      
      clipPath.append('rect')
        .attr('width', width)
        .attr('height', height);

      // Background circle
      svg.append('circle')
        .attr('cx', centerX)
        .attr('cy', centerY)
        .attr('r', size / 2 - 10)
        .attr('fill', colorScheme.transparent)
        .attr('stroke', colorScheme.border);

      // Wave path
      const waveData = d3.range(0, width + 10, 2).map((x, i) => {
        return {
          x: x,
          y: centerY + (height / 2) - (animatedProgress / total) * (height - 20) + 
             Math.sin((x + i) * 0.02) * waveHeight
        };
      });

      const waveLine = d3.line()
        .x(d => d.x)
        .y(d => d.y)
        .curve(d3.curveBasis);

      const waveArea = d3.area()
        .x(d => d.x)
        .y0(height)
        .y1(d => d.y)
        .curve(d3.curveBasis);

      // Animated wave
      svg.append('path')
        .datum(waveData)
        .attr('d', waveArea)
        .attr('fill', `url(#wave-gradient)`)
        .attr('clip-path', `circle(${size / 2 - 10}px at ${centerX}px ${centerY}px)`);

      // Wave gradient
      const waveGradient = svg.append('defs')
        .append('linearGradient')
        .attr('id', 'wave-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');
      
      waveGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', colorScheme.semiTransparent);
      
      waveGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', colorScheme.base);

      // Animate wave motion
      if (animated) {
        svg.select('path')
          .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .on('end', function repeat() {
            d3.select(this)
              .transition()
              .duration(2000)
              .ease(d3.easeLinear)
              .on('end', repeat);
          });
      }

      if (showValue) {
        svg.append('text')
          .attr('x', centerX)
          .attr('y', centerY)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.3em')
          .style('font-size', `${size * 0.08}px`)
          .style('font-weight', 'bold')
          .style('fill', 'white')
          .style('text-shadow', '0 2px 4px rgba(0,0,0,0.5)')
          .text(`${Math.round(animatedProgress)}%`);
      }
    }

    function renderRadialBars() {
      const radius = size / 2 - 30;
      const barCount = 12;
      const angleStep = (2 * Math.PI) / barCount;
      
      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const barProgress = Math.max(0, Math.min(1, (animatedProgress / total * barCount - i) / 1));
        const innerRadius = radius * 0.6;
        const outerRadius = innerRadius + (radius * 0.4 * barProgress);
        
        const x1 = centerX + Math.cos(angle) * innerRadius;
        const y1 = centerY + Math.sin(angle) * innerRadius;
        const x2 = centerX + Math.cos(angle) * outerRadius;
        const y2 = centerY + Math.sin(angle) * outerRadius;
        
        svg.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x1)
          .attr('y2', y1)
          .attr('stroke', colorScheme.base)
          .attr('stroke-width', 4)
          .attr('stroke-linecap', 'round')
          .transition()
          .delay(animated ? i * 100 : 0)
          .duration(animated ? 500 : 0)
          .attr('x2', x2)
          .attr('y2', y2);
      }

      if (showValue) {
        svg.append('text')
          .attr('x', centerX)
          .attr('y', centerY)
          .attr('text-anchor', 'middle')
          .attr('dy', '0.3em')
          .style('font-size', `${size * 0.06}px`)
          .style('font-weight', 'bold')
          .style('fill', colorScheme.base)
          .text(`${Math.round(animatedProgress)}%`);
      }
    }

  }, [animatedProgress, total, type, color, size, animated, showValue, label]);

  return (
    <div className="d3-progress-container" style={{ display: 'inline-block' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

// Advanced analytics dashboard component
export const AnalyticsDashboard = ({ data, title = "Analytics Dashboard" }) => {
  const svgRef = useRef();
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.date)))
      .range([0, width]);
    
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)])
      .nice()
      .range([height, 0]);
    
    // Create line generator
    const line = d3.line()
      .x(d => xScale(new Date(d.date)))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%b %d')));
    
    g.append('g')
      .call(d3.axisLeft(yScale));
    
    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(-height)
        .tickFormat('')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);
    
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat('')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3);
    
    // Add area under curve
    const area = d3.area()
      .x(d => xScale(new Date(d.date)))
      .y0(height)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);
    
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area)
      .style('opacity', 0.3);
    
    // Add gradient
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', height)
      .attr('x2', 0).attr('y2', 0);
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1976d2')
      .attr('stop-opacity', 0);
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1976d2')
      .attr('stop-opacity', 0.8);
    
    // Add line
    const path = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#1976d2')
      .attr('stroke-width', 3)
      .attr('d', line);
    
    // Animate line drawing
    const totalLength = path.node().getTotalLength();
    path
      .attr('stroke-dasharray', totalLength + ' ' + totalLength)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('stroke-dashoffset', 0);
    
    // Add data points
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(new Date(d.date)))
      .attr('cy', d => yScale(d.value))
      .attr('r', 0)
      .attr('fill', '#1976d2')
      .transition()
      .delay((d, i) => i * 100)
      .duration(500)
      .attr('r', 4);
    
    // Add title
    svg.append('text')
      .attr('x', width / 2 + margin.left)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text(title);
    
  }, [data, title]);
  
  return (
    <div className="analytics-dashboard">
      <svg ref={svgRef} width="800" height="400"></svg>
    </div>
  );
};

export default D3ProgressVisualization;
