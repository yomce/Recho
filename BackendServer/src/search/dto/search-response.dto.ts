import { Post } from '../../community/posts/entities/post.entity';
import { UsedProduct } from '../../used_product/entities/used-product.entity';
import { RecruitEnsemble } from '../../ensemble/entities/recruit-ensemble.entity';

export class SearchResponseDto {
  posts: Post[];
  usedProducts: UsedProduct[];

  recruitEnsembles: RecruitEnsemble[];
}
