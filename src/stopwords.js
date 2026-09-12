// Common English stopwords + a few filler words that dominate app review text
// without carrying insight ("app", "please", etc. are kept deliberately since
// they can be meaningful in context like "please fix").
module.exports = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'because', 'as',
  'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from',
  'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
  'further', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'than', 'too', 'very', 's',
  't', 'can', 'will', 'just', 'don', 'should', 'now', 'i', 'me', 'my',
  'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her',
  'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their',
  'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'would',
  'could', 'ought', 'im', 'youre', 'hes', 'shes', 'its', 'were', 'theyre',
  'ive', 'youve', 'weve', 'theyve', 'id', 'youd', 'hed', 'shed', 'wed',
  'theyd', 'ill', 'youll', 'hell', 'shell', 'well', 'theyll', 'isnt',
  'arent', 'wasnt', 'werent', 'hasnt', 'havent', 'hadnt', 'doesnt', 'dont',
  'didnt', 'wont', 'wouldnt', 'shant', 'shouldnt', 'cant', 'cannot',
  'couldnt', 'mustnt', 'lets', 'thats', 'whos', 'whats', 'heres', 'theres',
  'whens', 'wheres', 'whys', 'hows', 'get', 'got', 'getting', 'also',
]);
