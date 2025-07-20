import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, FileText, FolderOpen, AlertCircle, Star, BookOpen, TrendingUp, RefreshCw, Loader, Github } from 'lucide-react';

const DocumentSearchSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // GitHub repository configuration
  const GITHUB_CONFIG = {
    owner: 'Talion-101',
    repo: 'document-search-ui',
    branch: 'main'
  };

  // Function to determine file priority based on filename patterns
  const determinePriority = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('activity') || name.includes('marketing')) return 'high';
    if (name.includes('cla') || name.includes('essay')) return 'medium';
    return 'low';
  };

  // Function to determine category based on filename
  const determineCategory = (filename) => {
    const name = filename.toLowerCase();
    if (name.includes('activity')) return 'fundamentals';
    if (name.includes('cla')) return 'advanced';
    if (name.includes('essay')) return 'theory';
    if (name.includes('marketing')) return 'practical';
    return 'general';
  };

  // Function to generate learning value description
  const getLearningValue = (filename, category, priority) => {
    const name = filename.toLowerCase();
    if (name.includes('activity')) return 'Essential for understanding basic DPM workflows';
    if (name.includes('marketing')) return 'Real-world application and strategic planning';
    if (name.includes('essay')) return 'Theoretical foundation and case studies';
    if (name.includes('cla')) return 'Advanced concepts for DPM implementation';
    return `${priority === 'high' ? 'Essential' : priority === 'medium' ? 'Important' : 'Supplementary'} ${category} content`;
  };

  // Enhanced fallback documents with more variety
  const getFallbackDocuments = () => [
    {
      id: 1,
      name: "Activity",
      type: "DPM",
      filename: "Activity.docx",
      description: "Activity document for DPM processes and workflow management",
      size: "245 KB",
      lastModified: "2024-07-20",
      downloadUrl: "https://raw.githubusercontent.com/Talion-101/DPM/main/Activity.docx",
      priority: "high",
      category: "fundamentals",
      learningValue: "Essential for understanding basic DPM workflows"
    },
    {
      id: 2,
      name: "CLA 2",
      type: "DPM",
      filename: "CLA 2.docx",
      description: "Advanced CLA 2 document covering complex DPM scenarios",
      size: "189 KB",
      lastModified: "2024-07-20",
      downloadUrl: "https://raw.githubusercontent.com/Talion-101/DPM/main/CLA%202.docx",
      priority: "medium",
      category: "advanced",
      learningValue: "Advanced concepts for DPM implementation"
    },
    {
      id: 3,
      name: "Essay",
      type: "DPM",
      filename: "Essay.docx",
      description: "Comprehensive essay on DPM theoretical foundations",
      size: "167 KB",
      lastModified: "2024-07-20",
      downloadUrl: "https://raw.githubusercontent.com/Talion-101/DPM/main/Essay.docx",
      priority: "medium",
      category: "theory",
      learningValue: "Theoretical foundation and case studies"
    },
    {
      id: 4,
      name: "Marketing Plan",
      type: "DPM",
      filename: "Marketing plan.docx",
      description: "Strategic marketing plan utilizing DPM methodologies",
      size: "312 KB",
      lastModified: "2024-07-20",
      downloadUrl: "https://raw.githubusercontent.com/Talion-101/DPM/main/Marketing%20plan.docx",
      priority: "high",
      category: "practical",
      learningValue: "Real-world application and strategic planning"
    }
  ];

  // Function to fetch repository contents with better error handling
  const fetchRepositoryContents = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Try multiple API endpoints for better compatibility
      const endpoints = [
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/docs?ref=${GITHUB_CONFIG.branch}`,
        `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/git/trees/${GITHUB_CONFIG.branch}?recursive=1`
      ];
      
      let response;
      let contents;
      
      // Try the first endpoint (contents API)
      try {
        response = await fetch(endpoints[0], {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          }
        });
        
        if (response.ok) {
          contents = await response.json();
        } else {
          throw new Error(`Contents API failed: ${response.status}`);
        }
      } catch (firstError) {
        console.log('Contents API failed, trying tree API:', firstError.message);
        
        // Try the second endpoint (git trees API)
        response = await fetch(endpoints[1], {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          }
        });
        
        if (!response.ok) {
          throw new Error(`All APIs failed. Status: ${response.status} ${response.statusText}`);
        }
        
        const treeData = await response.json();
        // Transform tree API response to match contents API format
        contents = treeData.tree
  .filter(item => item.type === 'blob' && item.path.startsWith('docs/'))
  .map(item => ({
    name: item.path.replace(/^docs\//, ''),
    type: 'file',
    size: item.size,
    download_url: `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${item.path}`,
    html_url: `https://github.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/blob/${GITHUB_CONFIG.branch}/${item.path}`,
    sha: item.sha
        }));
      }
      
      // Filter for document files
      const documentFiles = contents.filter(item => 
        item.type === 'file' && 
        (item.name.endsWith('.docx') || 
         item.name.endsWith('.pdf') || 
         item.name.endsWith('.doc') ||
         item.name.endsWith('.txt') ||
         item.name.endsWith('.md') ||
         item.name.endsWith('.pptx') ||
         item.name.endsWith('.xlsx'))
      );
      
      if (documentFiles.length === 0) {
        throw new Error('No document files found in repository');
      }
      
      // Transform GitHub API response to our document format
      const transformedDocs = documentFiles.map((file, index) => {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        const priority = determinePriority(file.name);
        const category = determineCategory(file.name);
        
        return {
          id: index + 1,
          name: nameWithoutExt,
          type: "DPM",
          filename: file.name,
          description: `${nameWithoutExt} document for DPM processes`,
          size: file.size ? `${Math.round(file.size / 1024)} KB` : "Unknown",
          lastModified: new Date().toISOString().split('T')[0],
          downloadUrl: file.download_url,
          githubUrl: file.html_url,
          priority: priority,
          category: category,
          learningValue: getLearningValue(file.name, category, priority),
          sha: file.sha
        };
      });
      
      setDocuments(transformedDocs);
      setLastUpdated(new Date().toLocaleString());
      setError(null);
      
    } catch (err) {
      console.error('Error fetching repository contents:', err);
      setError(err.message);
      
      // Use fallback documents
      setDocuments(getFallbackDocuments());
      setLastUpdated(new Date().toLocaleString() + ' (Cached)');
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch documents on component mount
  useEffect(() => {
    fetchRepositoryContents();
  }, []);

  // Manual refresh function
  const handleRefresh = () => {
    fetchRepositoryContents(true);
  };

  // Recommended documents based on learning path
  const recommendedDocs = useMemo(() => {
    return documents
      .filter(doc => doc.priority === 'high')
      .concat(documents.filter(doc => doc.priority === 'medium').slice(0, 2));
  }, [documents]);

  // Fuzzy search functions
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  };

  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Search and filter documents
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      return { exact: [], similar: [], notFound: null, suggestion: null };
    }

    const term = searchTerm.toLowerCase().trim();
    const exact = [];
    const similar = [];

    documents.forEach(doc => {
      const docName = doc.name.toLowerCase();
      const docType = doc.type.toLowerCase();
      const docDescription = doc.description.toLowerCase();
      
      if (docName.includes(term) || docType.includes(term) || docDescription.includes(term)) {
        exact.push(doc);
      } else {
        const nameSimilarity = calculateSimilarity(term, docName);
        const descSimilarity = calculateSimilarity(term, docDescription);
        const maxSimilarity = Math.max(nameSimilarity, descSimilarity);
        
        if (maxSimilarity > 0.4) {
          similar.push({ ...doc, similarity: maxSimilarity });
        }
      }
    });

    similar.sort((a, b) => b.similarity - a.similarity);

    let notFound = null;
    let suggestion = null;
    
    if (exact.length === 0 && similar.length === 0) {
      let bestMatch = null;
      let bestSimilarity = 0;
      
      documents.forEach(doc => {
        const nameSimilarity = calculateSimilarity(term, doc.name.toLowerCase());
        if (nameSimilarity > bestSimilarity) {
          bestSimilarity = nameSimilarity;
          bestMatch = doc;
        }
      });
      
      if (bestMatch && bestSimilarity > 0.2) {
        notFound = term;
        suggestion = { ...bestMatch, similarity: bestSimilarity };
      }
    }

    return { exact, similar, notFound, suggestion };
  }, [searchTerm, documents]);

  const handleDownload = (doc) => {
    if (doc.downloadUrl) {
      const link = document.createElement('a');
      link.href = doc.downloadUrl;
      link.download = doc.filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`Downloading from GitHub: ${doc.name}`);
      return;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <Star className="h-4 w-4 text-yellow-400 fill-current" />;
      case 'medium':
        return <TrendingUp className="h-4 w-4 text-blue-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'Essential';
      case 'medium':
        return 'Important';
      default:
        return 'Reference';
    }
  };

  const DocumentCard = ({ doc, isExactMatch = true, similarity = null, isRecommended = false }) => (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 hover:border-blue-500/50 opacity-0 animate-fadeInUp ${
    isRecommended ? 'border-blue-600 bg-gray-800/80 backdrop-blur' : ''
  }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${doc.type === 'DPM' ? 'bg-blue-900/50 border border-blue-700' : 'bg-green-900/50 border border-green-700'}`}>
            <FileText className={`h-5 w-5 ${doc.type === 'DPM' ? 'text-blue-400' : 'text-green-400'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">{doc.name}</h3>
              {isRecommended && (
                <div className="flex items-center space-x-1">
                  {getPriorityIcon(doc.priority)}
                  <span className="text-xs font-medium text-blue-400">
                    {getPriorityLabel(doc.priority)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-300 mt-1">{doc.description}</p>
            {isRecommended && doc.learningValue && (
              <p className="text-sm text-blue-300 mt-2 italic">{doc.learningValue}</p>
            )}
            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
              <span className={`px-2 py-1 rounded-full border ${doc.type === 'DPM' ? 'bg-blue-900/50 text-blue-300 border-blue-700' : 'bg-green-900/50 text-green-300 border-green-700'}`}>
                {doc.type}
              </span>
              {doc.category && (
                <span className="capitalize">{doc.category}</span>
              )}
              <span>{doc.size}</span>
              <span>Modified: {doc.lastModified}</span>
              {!isExactMatch && similarity && (
                <span className="text-orange-400">
                  {Math.round(similarity * 100)}% match
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => handleDownload(doc)}
          className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all duration-300 text-sm shadow-lg hover:shadow-blue-500/25"
        >
          <Download className="h-4 w-4" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );

  // Enhanced loading screen with animations
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          {/* Animated GitHub icon */}
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-ping">
              <Github className="h-16 w-16 text-blue-500/20 mx-auto" />
            </div>
            <Github className="h-16 w-16 text-blue-500 mx-auto animate-pulse" />
          </div>
          
          {/* Loading spinner with gradient */}
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto">
              <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-700 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
            </div>
          </div>
          
          {/* Text with typewriter effect */}
return (
  <>
    {loading ? (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
            Initializing Document Command Console
          </h2>
          <p className="text-gray-400 animate-pulse">
            Syncing curated DPM files from GitHub...
          </p>
        </div>
      </div>
    ) : (
      <div>
        {/* 🔧 Replace this with your full document dashboard JSX */}
        <p className="text-white">Document dashboard goes here.</p>
      </div>
    )}
  </>
);
          {/* Progress dots */}
          <div className="flex justify-center space-x-1 mt-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-2">
              Document Search System
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl -z-10"></div>
          </div>
          <p className="text-gray-300 text-lg">Search and discover DPM learning resources</p>
          
          <div className="flex items-center justify-center space-x-6 mt-6">
            <div className="text-sm text-gray-400 flex items-center space-x-2">
              <Github className="h-4 w-4" />
              <span>{lastUpdated && `Last updated: ${lastUpdated}`}</span>
            </div>
            <button
              onClick={handleRefresh}
              className={`flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200 ${
                refreshing ? 'cursor-not-allowed' : 'hover:bg-blue-900/30'
              } px-3 py-1 rounded-lg`}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          
          {error && (
            <div className="mt-4 bg-yellow-900/50 border border-yellow-700 rounded-lg p-3 backdrop-blur">
              <p className="text-yellow-300 text-sm flex items-center justify-center space-x-2">
                <AlertCircle className="h-4 w-4" />
                <span><strong>Note:</strong> Using cached data due to API error: {error}</span>
              </p>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search for documents by name, type, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400 text-lg transition-all duration-300 hover:border-gray-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </div>

        {/* Search Results */}
        {searchTerm && (
          <div className="space-y-6">
            {/* File Not Found with Suggestion */}
            {searchResults.notFound && searchResults.suggestion && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 backdrop-blur">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-300 mb-2">
                      File "{searchResults.notFound}" not found
                    </h3>
                    <p className="text-red-200 mb-4">
                      The file you're looking for doesn't exist in our system. However, you might want to learn more from this similar document:
                    </p>
                    <div className="bg-gray-800 rounded-lg border border-red-600 p-4">
                      <DocumentCard 
                        doc={searchResults.suggestion} 
                        isExactMatch={false} 
                        similarity={searchResults.suggestion.similarity}
                      />
                      <div className="mt-3 text-sm text-red-300 flex items-center">
                        <span className="font-medium">Suggested because:</span>
                        <span className="ml-2">
                          {Math.round(searchResults.suggestion.similarity * 100)}% name similarity to your search
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Exact Matches */}
            {searchResults.exact.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <FolderOpen className="h-5 w-5 mr-2 text-green-400" />
                  Exact Matches ({searchResults.exact.length})
                </h2>
                <div className="space-y-3">
                  {searchResults.exact.map(doc => (
                    <DocumentCard key={doc.id} doc={doc} isExactMatch={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Similar Matches */}
            {searchResults.similar.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-400" />
                  Similar Matches ({searchResults.similar.length})
                </h2>
                <div className="space-y-3">
                  {searchResults.similar.map(doc => (
                    <DocumentCard 
                      key={doc.id} 
                      doc={doc} 
                      isExactMatch={false} 
                      similarity={doc.similarity}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results at all */}
            {searchResults.exact.length === 0 && searchResults.similar.length === 0 && !searchResults.notFound && (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
                <p className="text-gray-400">Try searching with different keywords or check your spelling.</p>
              </div>
            )}
          </div>
        )}

        {/* Recommended Documents (when no search) */}
        {!searchTerm && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400 fill-current" />
              Recommended Files to Read & Learn
            </h2>
            <p className="text-gray-300 mb-6">
              Start your DPM learning journey with these essential documents, carefully selected based on their importance and learning value.
            </p>
            <div className="grid gap-4">
              {recommendedDocs.map(doc => (
                <DocumentCard key={doc.id} doc={doc} isRecommended={true} />
              ))}
            </div>
            
            {/* Learning Path Guide */}
            <div className="mt-8 bg-blue-900/20 border border-blue-700 rounded-lg p-6 backdrop-blur">
              <h3 className="font-semibold text-blue-300 mb-3 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Suggested Learning Path
              </h3>
              <div className="space-y-2 text-sm text-blue-200">
                <p><span className="font-medium">1. Start with:</span> Activity document - foundational concepts</p>
                <p><span className="font-medium">2. Apply knowledge:</span> Marketing Plan - practical implementation</p>
                <p><span className="font-medium">3. Deepen understanding:</span> Essay - theoretical background</p>
                <p><span className="font-medium">4. Advanced topics:</span> CLA 2 - complex scenarios</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 bg-gray-800/50 border border-gray-700 rounded-lg p-6 backdrop-blur">
          <h3 className="font-semibold text-white mb-4">Document Statistics</h3>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 p-4 rounded-lg border border-yellow-700/50">
              <div className="text-2xl font-bold text-yellow-400">
                {documents.filter(d => d.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-300">Essential Documents</div>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-4 rounded-lg border border-blue-700/50">
              <div className="text-2xl font-bold text-blue-400">
                {documents.filter(d => d.priority === 'medium').length}
              </div>
              <div className="text-sm text-gray-300">Important Documents</div>
            </div>
            <div className="bg-gradient-to-br from-gray-600/20 to-gray-800/20 p-4 rounded-lg border border-gray-700/50">
              <div className="text-2xl font-bold text-white">
                {documents.length}
              </div>
              <div className="text-sm text-gray-300">Total Documents</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSearchSystem;
