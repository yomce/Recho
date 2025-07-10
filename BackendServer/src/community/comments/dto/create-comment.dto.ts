export class CreateCommentDto {
  author: string;
  content: string;
  postId: number; // 어떤 게시물에 달린 댓글인지 식별
}