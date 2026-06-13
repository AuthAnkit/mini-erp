package com.minierp.repository;

import com.minierp.entity.ChatMessage;
import com.minierp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    Page<ChatMessage> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.user.id = :userId ORDER BY cm.createdAt DESC")
    List<ChatMessage> findChatHistoryByUser(@Param("userId") Long userId);
    
    @Query("SELECT cm FROM ChatMessage cm WHERE cm.queryType = :queryType ORDER BY cm.createdAt DESC")
    List<ChatMessage> findByQueryType(@Param("queryType") String queryType);
}
