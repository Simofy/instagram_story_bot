// Test the demotyvacijos image generation
import demotyvacijosFetcher from './demotyvacijos_worker.js';

async function testDemotyvacijosImageGeneration() {
  try {
    console.log('Testing demotyvacijos image generation...');
    
    // Test the generateDemotyvacijosImage function
    const outputPath = await demotyvacijosFetcher.generateDemotyvacijosImage('test_demotyvacijos.jpg');
    console.log('Image generated successfully:', outputPath);
    
    console.log('Stats after generation:', demotyvacijosFetcher.getStats());
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDemotyvacijosImageGeneration();
