import React, { useEffect, useState, useContext } from "react";
import { db } from "../firebase";
import { collection, query, getDocs, addDoc, orderBy, onSnapshot, getDoc, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from '../main';
import './AppComments.css';

const AppComments = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [userName, setUserName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showModerationTools, setShowModerationTools] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Get user from AuthContext
  const authContext = useContext(AuthContext);
const user = authContext?.user;

  useEffect(() => {
    const getUserName = async (user) => {
      if (!user) {
        setUserName("");
        return;
      }
      if (user.displayName) {
        setUserName(user.displayName);
        return;
      }
      // Try to fetch from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().name) {
          setUserName(userDoc.data().name);
        } else {
          setUserName(user.email || "");
        }
      } catch (e) {
        setUserName(user.email || "");
      }
    };
    getUserName(user);
  }, [user]);

  // Fetch comments with real-time updates
  useEffect(() => {
    const fetchComments = async () => {
      try {
        console.log('Fetching app comments');
        
        // Set up real-time listener for comments
        const commentsQuery = query(
          collection(db, 'appComments'),
          orderBy('createdAt', 'desc') // Newest first
        );
        
        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
          const commentsData = [];
          snapshot.forEach(doc => {
            commentsData.push({ id: doc.id, ...doc.data() });
          });
          
          console.log('Comments fetched:', commentsData.length);
          setComments(commentsData);
          setLoading(false);
        }, (error) => {
          console.error('Error fetching comments:', error);
          console.error('Error code:', error.code);
          console.error('Error details:', error);
          
          if (error.code === 'permission-denied') {
            console.error('Permission denied when fetching comments. Firestore rules may not be deployed.');
          }
          setLoading(false);
        });

        // Return cleanup function
        return () => unsubscribe();
      } catch (error) {
        console.error('Error setting up comments listener:', error);
        setLoading(false);
      }
    };

    fetchComments();
  }, []);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!user || !user.uid) {
      alert('Please log in to add a comment.');
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment.');
      return;
    }

    setSubmitting(true);

    try {
      const commentData = {
        userId: user.uid,
        userName: userName || user.email || 'Anonymous',
        comment: newComment.trim(),
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        replies: [],
        isEdited: false,
        editedAt: null,
        parentId: null,
        category: "general", // Default category
        tags: [], // For future tag system
        reputation: 0 // For user reputation system
      };
      
      console.log('Adding app comment:', commentData);
      await addDoc(collection(db, 'appComments'), commentData);
      console.log('Comment added successfully');
      
      // Reset form
      setNewComment("");
      alert('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
      
      if (error.code === 'permission-denied') {
        alert('Permission denied. This might be due to Firestore rules not being deployed. Please contact the administrator.');
      } else {
        alert('Error adding comment: ' + error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId, commentUserId) => {
    if (!user || !user.uid) {
      alert('Please log in to delete comments.');
      return;
    }

    if (commentUserId !== user.uid && !isAdmin) {
      alert('You can only delete your own comments.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('Deleting comment:', commentId);
      await deleteDoc(doc(db, 'appComments', commentId));
      console.log('Comment deleted successfully');
      alert('Comment deleted successfully!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
      
      if (error.code === 'permission-denied') {
        alert('Permission denied. This might be due to Firestore rules not being deployed. Please contact the administrator.');
      } else {
        alert('Error deleting comment: ' + error.message);
      }
    }
  };

  // Edit comment function
  const handleEditComment = async (commentId, commentUserId) => {
    if (!user || !user.uid) {
      alert('Please log in to edit comments.');
      return;
    }

    if (commentUserId !== user.uid) {
      alert('You can only edit your own comments.');
      return;
    }

    try {
      await updateDoc(doc(db, 'appComments', commentId), {
        comment: editText.trim(),
        isEdited: true,
        editedAt: new Date().toISOString()
      });
      
      setEditingComment(null);
      setEditText("");
      alert('Comment updated successfully!');
    } catch (error) {
      console.error('Error updating comment:', error);
      alert('Error updating comment: ' + error.message);
    }
  };

  // Reply to comment function
  const handleReplyComment = async (parentCommentId) => {
    if (!user || !user.uid) {
      alert('Please log in to reply to comments.');
      return;
    }

    if (!replyText.trim()) {
      alert('Please enter a reply.');
      return;
    }

    setSubmitting(true);

    try {
      const replyData = {
        userId: user.uid,
        userName: userName || user.email || 'Anonymous',
        comment: replyText.trim(),
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        likedBy: [],
        dislikedBy: [],
        replies: [],
        isEdited: false,
        editedAt: null,
        parentId: parentCommentId
      };
      
      await addDoc(collection(db, 'appComments'), replyData);
      
      setReplyingTo(null);
      setReplyText("");
      alert('Reply posted successfully!');
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Error adding reply: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reactions (like/dislike)
  const handleReaction = async (commentId, reactionType) => {
    if (!user || !user.uid) {
      alert('Please log in to react to comments.');
      return;
    }

    try {
      const commentRef = doc(db, 'appComments', commentId);
      const commentDoc = await getDoc(commentRef);
      
      if (!commentDoc.exists()) {
        alert('Comment not found.');
        return;
      }

      const commentData = commentDoc.data();
      const userId = user.uid;
      let newLikes = commentData.likes || 0;
      let newDislikes = commentData.dislikes || 0;
      let likedBy = commentData.likedBy || [];
      let dislikedBy = commentData.dislikedBy || [];

      if (reactionType === 'like') {
        if (likedBy.includes(userId)) {
          // Unlike
          likedBy = likedBy.filter(id => id !== userId);
          newLikes--;
        } else {
          // Like
          likedBy.push(userId);
          newLikes++;
          // Remove from dislikes if previously disliked
          if (dislikedBy.includes(userId)) {
            dislikedBy = dislikedBy.filter(id => id !== userId);
            newDislikes--;
          }
        }
      } else if (reactionType === 'dislike') {
        if (dislikedBy.includes(userId)) {
          // Remove dislike
          dislikedBy = dislikedBy.filter(id => id !== userId);
          newDislikes--;
        } else {
          // Dislike
          dislikedBy.push(userId);
          newDislikes++;
          // Remove from likes if previously liked
          if (likedBy.includes(userId)) {
            likedBy = likedBy.filter(id => id !== userId);
            newLikes--;
          }
        }
      }

      await updateDoc(commentRef, {
        likes: newLikes,
        dislikes: newDislikes,
        likedBy: likedBy,
        dislikedBy: dislikedBy
      });

    } catch (error) {
      console.error('Error updating reaction:', error);
      alert('Error updating reaction: ' + error.message);
    }
  };

  // Check if user is admin (you can customize this logic)
  useEffect(() => {
    if (user && user.email) {
      // Add your admin email addresses here
      const adminEmails = ['admin@example.com', 'your-email@example.com'];
      setIsAdmin(adminEmails.includes(user.email));
    }
  }, [user]);

  // Filter and sort comments
  const filteredAndSortedComments = comments
    .filter(comment => {
      // Filter by search term
      if (searchTerm && !comment.comment.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !comment.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filter by category
      if (selectedCategory !== "all") {
        const commentCategory = comment.category || "general";
        if (commentCategory !== selectedCategory) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "mostLiked":
          return (b.likes || 0) - (a.likes || 0);
        case "mostReplied":
          const aReplies = comments.filter(c => c.parentId === a.id).length;
          const bReplies = comments.filter(c => c.parentId === b.id).length;
          return bReplies - aReplies;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Get unique categories from comments
  const categories = ["all", ...new Set(comments.map(c => c.category || "general"))];

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-comments-container">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          color: '#ffd740',
          fontSize: '1.5rem',
          fontWeight: '700',
          margin: 0
        }}>
          💬 App Feedback & Comments
        </h3>
        
        {/* Moderation tools for admins */}
        {isAdmin && (
          <button
            onClick={() => setShowModerationTools(!showModerationTools)}
            style={{
              background: 'rgba(255, 215, 64, 0.2)',
              color: '#ffd740',
              border: '1px solid rgba(255, 215, 64, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            {showModerationTools ? 'Hide' : 'Show'} Moderation Tools
          </button>
        )}
      </div>
      
      <p style={{
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '1rem',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        Share your thoughts about our app, suggest improvements, or discuss features with other users
      </p>

      {/* Moderation Tools for Admins */}
      {showModerationTools && isAdmin && (
        <div className="moderation-tools">
          <h4>🛡️ Moderation Tools</h4>
          <div className="moderation-stats">
            <div className="stat-item">
              <span className="stat-number">{comments.length}</span>
              <span className="stat-label">Total Comments</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{comments.filter(c => c.parentId).length}</span>
              <span className="stat-label">Replies</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{comments.filter(c => c.isEdited).length}</span>
              <span className="stat-label">Edited</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {comments.reduce((total, c) => total + (c.likes || 0), 0)}
              </span>
              <span className="stat-label">Total Likes</span>
            </div>
          </div>
                     <div className="action-buttons">
             <button
               onClick={() => {
                 const recentComments = comments.filter(c => {
                   const commentDate = new Date(c.createdAt);
                   const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                   return commentDate > oneDayAgo;
                 });
                 alert(`Recent comments (last 24h): ${recentComments.length}`);
               }}
               className="action-button"
             >
               View Recent
             </button>
             <button
               onClick={() => {
                 const popularComments = comments
                   .filter(c => !c.parentId)
                   .sort((a, b) => (b.likes || 0) - (a.likes || 0))
                   .slice(0, 5);
                 alert(`Top 5 popular comments:\n${popularComments.map((c, i) => `${i + 1}. ${c.comment.substring(0, 50)}... (${c.likes} likes)`).join('\n')}`);
               }}
               className="action-button"
             >
               Popular Comments
             </button>
             <button
               onClick={() => {
                 const analytics = {
                   totalComments: comments.length,
                   totalReplies: comments.filter(c => c.parentId).length,
                   totalLikes: comments.reduce((sum, c) => sum + (c.likes || 0), 0),
                   totalDislikes: comments.reduce((sum, c) => sum + (c.dislikes || 0), 0),
                   editedComments: comments.filter(c => c.isEdited).length,
                   uniqueUsers: new Set(comments.map(c => c.userId)).size,
                   avgLikesPerComment: (comments.reduce((sum, c) => sum + (c.likes || 0), 0) / Math.max(comments.length, 1)).toFixed(1)
                 };
                 alert(`📊 Analytics Dashboard:\n\n` +
                       `Total Comments: ${analytics.totalComments}\n` +
                       `Total Replies: ${analytics.totalReplies}\n` +
                       `Total Likes: ${analytics.totalLikes}\n` +
                       `Total Dislikes: ${analytics.totalDislikes}\n` +
                       `Edited Comments: ${analytics.editedComments}\n` +
                       `Unique Users: ${analytics.uniqueUsers}\n` +
                       `Avg Likes/Comment: ${analytics.avgLikesPerComment}`);
               }}
               className="action-button"
             >
               Analytics
             </button>
             <button
               onClick={() => {
                 const topUsers = comments.reduce((acc, comment) => {
                   const userId = comment.userId;
                   if (!acc[userId]) {
                     acc[userId] = {
                       name: comment.userName,
                       comments: 0,
                       likes: 0,
                       reputation: comment.reputation || 0
                     };
                   }
                   acc[userId].comments++;
                   acc[userId].likes += comment.likes || 0;
                   return acc;
                 }, {});
                 
                 const topUsersList = Object.values(topUsers)
                   .sort((a, b) => b.comments - a.comments)
                   .slice(0, 5);
                 
                 alert(`👥 Top Users:\n\n` +
                       topUsersList.map((user, i) => 
                         `${i + 1}. ${user.name} - ${user.comments} comments, ${user.likes} total likes`
                       ).join('\n'));
               }}
               className="action-button"
             >
               Top Users
             </button>
           </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="search-filter-container">
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '16px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search Input */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search comments..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 215, 64, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '0.9rem'
              }}
            />
          </div>
          
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 215, 64, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.9rem',
              minWidth: '120px'
            }}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 215, 64, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '0.9rem',
              minWidth: '120px'
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="mostLiked">Most Liked</option>
            <option value="mostReplied">Most Replied</option>
          </select>
          
          {/* Advanced Filters Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              background: 'rgba(255, 215, 64, 0.2)',
              color: '#ffd740',
              border: '1px solid rgba(255, 215, 64, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
          </button>
        </div>
        
        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>
                  Date Range
                </label>
                <select style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.8rem'
                }}>
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
              
              <div>
                <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.8rem', display: 'block', marginBottom: '4px' }}>
                  Show Only
                </label>
                <select style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '0.8rem'
                }}>
                  <option value="all">All Comments</option>
                  <option value="edited">Edited Comments</option>
                  <option value="replies">Comments with Replies</option>
                  <option value="liked">Liked Comments</option>
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Results Summary */}
        <div style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.9rem',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          Showing {filteredAndSortedComments.filter(c => !c.parentId).length} of {comments.filter(c => !c.parentId).length} comments
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>

      {/* Add Comment Form */}
      {user ? (
        <form onSubmit={handleSubmitComment} className="comment-form">
          <div style={{ marginBottom: '16px' }}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about the app, suggest improvements, or discuss features..."
              className="comment-textarea"
              required
            />
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.9rem'
            }}>
              Commenting as: {userName || user.email || 'Anonymous'}
            </span>
            
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="comment-submit-button"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="login-prompt">
          <p className="login-prompt-text">
            Please log in to add a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px'
        }}>
          <div className="loading-spinner"></div>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0
          }}>
            Loading comments...
          </p>
        </div>
      ) : comments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            💬
          </div>
          <h4 className="empty-state-title">
            No comments yet
          </h4>
          <p className="empty-state-text">
            Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredAndSortedComments.filter(comment => !comment.parentId).map((comment, index) => (
            <div key={`comment-${comment.id}-${index}`} className="comment-item">
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div className="user-avatar">
                  {comment.userName ? comment.userName.charAt(0).toUpperCase() : 'A'}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '8px',
                    flexWrap: 'wrap'
                  }}>
                                         <span className="user-name">
                       {comment.userName || 'Anonymous'}
                       {comment.reputation > 0 && (
                         <span style={{
                           color: '#4caf50',
                           fontSize: '0.8rem',
                           marginLeft: '4px',
                           fontWeight: '600'
                         }}>
                           ⭐ {comment.reputation}
                         </span>
                       )}
                     </span>
                    
                                         <span className="timestamp">
                       {formatTimestamp(comment.createdAt)}
                       {comment.isEdited && (
                         <span style={{ color: 'rgba(255, 255, 255, 0.5)', marginLeft: '8px' }}>
                           (edited)
                         </span>
                       )}
                     </span>
                     
                     {/* Category Badge */}
                     {comment.category && comment.category !== "general" && (
                       <span style={{
                         background: 'rgba(255, 215, 64, 0.2)',
                         color: '#ffd740',
                         padding: '2px 8px',
                         borderRadius: '12px',
                         fontSize: '0.7rem',
                         fontWeight: '600',
                         border: '1px solid rgba(255, 215, 64, 0.3)'
                       }}>
                         {comment.category}
                       </span>
                     )}
                  </div>
                  
                  <div className="comment-content">
                    {editingComment === comment.id ? (
                      <div>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="comment-textarea"
                          style={{ marginBottom: '8px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleEditComment(comment.id, comment.userId)}
                            className="comment-submit-button"
                            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingComment(null);
                              setEditText("");
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              color: '#ffffff',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              borderRadius: '6px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '0.8rem'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-text rich-text">
                        {comment.comment
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code>$1</code>')
                          .split('\n').map((line, i) => (
                            <span key={i}>
                              {line}
                              {i < comment.comment.split('\n').length - 1 && <br />}
                            </span>
                          ))}
                      </p>
                    )}
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '12px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Reactions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleReaction(comment.id, 'like')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: comment.likedBy?.includes(user?.uid) ? '#4caf50' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        disabled={!user}
                      >
                        👍 {comment.likes || 0}
                      </button>
                      
                      <button
                        onClick={() => handleReaction(comment.id, 'dislike')}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: comment.dislikedBy?.includes(user?.uid) ? '#f44336' : 'rgba(255, 255, 255, 0.6)',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        disabled={!user}
                      >
                        👎 {comment.dislikes || 0}
                      </button>
                    </div>
                    
                    {/* Reply button */}
                    <button
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.9rem',
                        textDecoration: 'underline'
                      }}
                      disabled={!user}
                    >
                      Reply
                    </button>
                    
                    {/* Edit button for user's own comments */}
                    {user && comment.userId === user.uid && (
                      <button
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditText(comment.comment);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.9rem',
                          textDecoration: 'underline'
                        }}
                      >
                        Edit
                      </button>
                    )}
                    
                    {/* Delete button for user's own comments or admin */}
                    {(user && comment.userId === user.uid) || isAdmin ? (
                      <button
                        onClick={() => handleDeleteComment(comment.id, comment.userId)}
                        style={{
                          background: 'rgba(244, 67, 54, 0.2)',
                          color: '#f44336',
                          border: '1px solid rgba(244, 67, 54, 0.3)',
                          borderRadius: '6px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(244, 67, 54, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(244, 67, 54, 0.2)';
                        }}
                      >
                        Delete
                      </button>
                    ) : null}
                  </div>
                  
                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="comment-textarea"
                        style={{ marginBottom: '8px', minHeight: '60px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleReplyComment(comment.id)}
                          disabled={submitting || !replyText.trim()}
                          className="comment-submit-button"
                          style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                        >
                          {submitting ? 'Posting...' : 'Post Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Replies */}
                  {comments.filter(reply => reply.parentId === comment.id).map((reply, replyIndex) => (
                    <div key={`reply-${reply.id}-${replyIndex}`} style={{
                      marginTop: '12px',
                      marginLeft: '20px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <div className="user-avatar" style={{ width: '30px', height: '30px', fontSize: '0.9rem' }}>
                          {reply.userName ? reply.userName.charAt(0).toUpperCase() : 'A'}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginBottom: '6px',
                            flexWrap: 'wrap'
                          }}>
                            <span className="user-name" style={{ fontSize: '0.9rem' }}>
                              {reply.userName || 'Anonymous'}
                            </span>
                            
                            <span className="timestamp" style={{ fontSize: '0.8rem' }}>
                              {formatTimestamp(reply.createdAt)}
                              {reply.isEdited && (
                                <span style={{ color: 'rgba(255, 255, 255, 0.5)', marginLeft: '4px' }}>
                                  (edited)
                                </span>
                              )}
                            </span>
                          </div>
                          
                                                     <p className="comment-text rich-text" style={{ fontSize: '0.9rem', margin: '0 0 8px 0' }}>
                             {reply.comment
                               .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                               .replace(/\*(.*?)\*/g, '<em>$1</em>')
                               .replace(/`(.*?)`/g, '<code>$1</code>')
                               .split('\n').map((line, i) => (
                                 <span key={i}>
                                   {line}
                                   {i < reply.comment.split('\n').length - 1 && <br />}
                                 </span>
                               ))}
                           </p>
                          
                          {/* Reply actions */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.8rem'
                          }}>
                            <button
                              onClick={() => handleReaction(reply.id, 'like')}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: reply.likedBy?.includes(user?.uid) ? '#4caf50' : 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              disabled={!user}
                            >
                              👍 {reply.likes || 0}
                            </button>
                            
                            <button
                              onClick={() => handleReaction(reply.id, 'dislike')}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: reply.dislikedBy?.includes(user?.uid) ? '#f44336' : 'rgba(255, 255, 255, 0.6)',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              disabled={!user}
                            >
                              👎 {reply.dislikes || 0}
                            </button>
                            
                            {(user && reply.userId === user.uid) || isAdmin ? (
                              <button
                                onClick={() => handleDeleteComment(reply.id, reply.userId)}
                                style={{
                                  background: 'rgba(244, 67, 54, 0.2)',
                                  color: '#f44336',
                                  border: '1px solid rgba(244, 67, 54, 0.3)',
                                  borderRadius: '4px',
                                  padding: '4px 8px',
                                  cursor: 'pointer',
                                  fontSize: '0.7rem'
                                }}
                              >
                                Delete
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


    </div>
  );
};

export default AppComments; 