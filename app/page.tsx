'use client';

import { useState } from 'react';

interface OptimizedSEO {
  title: string;
  description: string;
  tags: string[];
}

interface OriginalInfo {
  title: string;
  description: string;
  tags: string[];
}

interface ChannelAnalysis {
  channelName: string;
  sampleTitles: string[];
  sampleTags: string[];
}

interface AnalysisResult {
  original: OriginalInfo;
  optimized: OptimizedSEO;
  channelAnalyses: ChannelAnalysis[];
}

export default function Home() {
  const [referenceChannels, setReferenceChannels] = useState<string[]>([
    'https://www.youtube.com/@Top5News4',
    'https://www.youtube.com/@TazaHalaat'
  ]);
  const [targetVideo, setTargetVideo] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');

  const handleAddChannel = () => {
    setReferenceChannels([...referenceChannels, '']);
  };

  const handleChannelChange = (index: number, value: string) => {
    const updated = [...referenceChannels];
    updated[index] = value;
    setReferenceChannels(updated);
  };

  const handleRemoveChannel = (index: number) => {
    if (referenceChannels.length > 1) {
      setReferenceChannels(referenceChannels.filter((_, i) => i !== index));
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          referenceChannels: referenceChannels.filter(c => c.trim()),
          targetVideo: targetVideo.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          YouTube SEO Optimizer
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#666',
          fontSize: '16px',
          marginBottom: '40px'
        }}>
          Analyze successful channels and optimize your video's title, description, and tags
        </p>

        {/* Reference Channels Section */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#333',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            Reference Channels to Learn From
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Add YouTube channels that have successful SEO strategies you want to emulate
          </p>

          {referenceChannels.map((channel, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={channel}
                onChange={(e) => handleChannelChange(index, e.target.value)}
                placeholder="https://www.youtube.com/@ChannelName"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <button
                onClick={() => handleRemoveChannel(index)}
                disabled={referenceChannels.length === 1}
                style={{
                  padding: '12px 20px',
                  background: referenceChannels.length === 1 ? '#ccc' : '#ff4757',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: referenceChannels.length === 1 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={handleAddChannel}
            style={{
              padding: '12px 24px',
              background: '#48bb78',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
              marginTop: '10px'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#38a169'}
            onMouseOut={(e) => e.currentTarget.style.background = '#48bb78'}
          >
            + Add Another Channel
          </button>
        </div>

        {/* Target Video Section */}
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#333',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
            Your Video to Optimize
          </h2>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
            Enter the URL of the video you want to optimize
          </p>
          <input
            type="text"
            value={targetVideo}
            onChange={(e) => setTargetVideo(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.3s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !targetVideo.trim()}
          style={{
            width: '100%',
            padding: '16px',
            background: loading || !targetVideo.trim()
              ? '#ccc'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '700',
            cursor: loading || !targetVideo.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s',
            marginBottom: '30px'
          }}
        >
          {loading ? '🔄 Analyzing...' : '🚀 Generate Optimized SEO'}
        </button>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '16px',
            background: '#fee',
            border: '2px solid #fcc',
            borderRadius: '10px',
            color: '#c33',
            marginBottom: '20px',
            fontSize: '15px'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div style={{ marginTop: '40px' }}>
            {/* Channel Analyses */}
            <div style={{
              background: '#f8f9fa',
              padding: '25px',
              borderRadius: '15px',
              marginBottom: '30px'
            }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#333',
                marginBottom: '20px'
              }}>
                📈 Reference Channels Analysis
              </h3>

              {result.channelAnalyses.map((channel, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '15px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h4 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#667eea',
                    marginBottom: '12px'
                  }}>
                    {channel.channelName}
                  </h4>

                  <div style={{ marginBottom: '12px' }}>
                    <strong style={{ color: '#555' }}>Sample Titles:</strong>
                    <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                      {channel.sampleTitles.map((title, i) => (
                        <li key={i} style={{ color: '#666', marginBottom: '4px', fontSize: '14px' }}>
                          {title}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <strong style={{ color: '#555' }}>Common Tags:</strong>
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {channel.sampleTags.map((tag, i) => (
                        <span key={i} style={{
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '500'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Original vs Optimized */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Original */}
              <div style={{
                background: '#fff5f5',
                padding: '25px',
                borderRadius: '15px',
                border: '2px solid #feb2b2'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#c53030',
                  marginBottom: '20px'
                }}>
                  📄 Original
                </h3>

                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ color: '#555', fontSize: '14px' }}>Title:</strong>
                  <p style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    lineHeight: '1.5'
                  }}>
                    {result.original.title || 'N/A'}
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <strong style={{ color: '#555', fontSize: '14px' }}>Description:</strong>
                  <p style={{
                    marginTop: '8px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#333',
                    lineHeight: '1.5',
                    maxHeight: '150px',
                    overflow: 'auto'
                  }}>
                    {result.original.description || 'N/A'}
                  </p>
                </div>

                <div>
                  <strong style={{ color: '#555', fontSize: '14px' }}>Tags:</strong>
                  <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.original.tags.slice(0, 10).map((tag, i) => (
                      <span key={i} style={{
                        background: 'white',
                        color: '#c53030',
                        padding: '4px 10px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        border: '1px solid #feb2b2'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optimized */}
              <div style={{
                background: '#f0fff4',
                padding: '25px',
                borderRadius: '15px',
                border: '2px solid #9ae6b4'
              }}>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#2f855a',
                  marginBottom: '20px'
                }}>
                  ✨ Optimized
                </h3>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#555', fontSize: '14px' }}>Title:</strong>
                    <button
                      onClick={() => copyToClipboard(result.optimized.title)}
                      style={{
                        padding: '4px 12px',
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <p style={{
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#333',
                    lineHeight: '1.5',
                    fontWeight: '500'
                  }}>
                    {result.optimized.title}
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#555', fontSize: '14px' }}>Description:</strong>
                    <button
                      onClick={() => copyToClipboard(result.optimized.description)}
                      style={{
                        padding: '4px 12px',
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy
                    </button>
                  </div>
                  <p style={{
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#333',
                    lineHeight: '1.6',
                    maxHeight: '150px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {result.optimized.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <strong style={{ color: '#555', fontSize: '14px' }}>Tags:</strong>
                    <button
                      onClick={() => copyToClipboard(result.optimized.tags.join(', '))}
                      style={{
                        padding: '4px 12px',
                        background: '#48bb78',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Copy All
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.optimized.tags.map((tag, i) => (
                      <span key={i} style={{
                        background: 'white',
                        color: '#2f855a',
                        padding: '4px 10px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        border: '1px solid #9ae6b4',
                        fontWeight: '500'
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: '30px',
        color: 'white',
        fontSize: '14px',
        opacity: 0.9
      }}>
        <p>Powered by AI • Optimized for YouTube Success 🚀</p>
      </div>
    </div>
  );
}
