def test_service_recommend_calls_strategy(menu_service):
    """서비스의 recommend가 정상적으로 결과를 반환하는지 테스트"""
    menus = menu_service.recommend(limit=3)
    assert isinstance(menus, list)
    assert len(menus) <= 3


def test_service_get_all_menus(menu_service):
    """get_all_menus가 모든 메뉴를 반환하는지 테스트"""
    all_menus = menu_service.get_all_menus()
    assert len(all_menus) == 5  # Mock Repo has 5 items
