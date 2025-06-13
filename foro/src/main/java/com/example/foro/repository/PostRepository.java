package com.example.foro.repository;

import com.example.foro.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findBySubforoIdOrderByFechaCreacionDesc(Long subforoId);

    List<Post> findAllByOrderByFechaCreacionDesc();
}
